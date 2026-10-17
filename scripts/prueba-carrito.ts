/**
 * Prueba del carrito de invitado y de la fusión al iniciar sesión.
 *
 * Es la parte del sistema con más casos borde, y la que más fácil se rompe en
 * silencio: si la fusión falla, el cliente pierde lo que había elegido y no se
 * entera hasta que mira el carrito.
 *
 * Se corre contra la base de desarrollo. Crea datos y los borra al final.
 *
 * Uso: npm run prueba:carrito
 */
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  actualizarCantidad,
  agregarAlCarrito,
  contarUnidades,
  fusionarCarritoDeInvitado,
  itemsDelCarrito,
  limpiarCarritosDeInvitadoViejos,
  quitarDelCarrito,
  type DuenoCarrito,
} from "../lib/carrito";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

let fallos = 0;

function verificar(descripcion: string, condicion: boolean, detalle = "") {
  if (condicion) {
    console.log(`  ✓ ${descripcion}`);
  } else {
    fallos++;
    console.log(`  ✗ ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  }
}

const TOKEN_INVITADO = "token-de-prueba-carrito";
const TOKEN_VIEJO = "token-viejo-de-prueba";
const TOKEN_RECIENTE = "token-reciente-de-prueba";
const TOKENS_DE_PRUEBA = [TOKEN_INVITADO, TOKEN_VIEJO, TOKEN_RECIENTE];

async function main() {
  console.log("Probando el carrito de invitado...\n");

  // --- Preparación
  const usuario = await prisma.user.upsert({
    where: { email: "prueba-carrito@local" },
    update: {},
    create: { email: "prueba-carrito@local", name: "Invitado de prueba" },
  });

  const invitado: DuenoCarrito = {
    tipo: "invitado",
    cartToken: TOKEN_INVITADO,
  };
  const deLaCuenta: DuenoCarrito = { tipo: "usuario", userId: usuario.id };

  const limpiar = async () => {
    await prisma.cartItem.deleteMany({
      where: {
        OR: [{ cartToken: { in: TOKENS_DE_PRUEBA } }, { userId: usuario.id }],
      },
    });
  };
  await limpiar();

  const variantes = await prisma.productVariant.findMany({
    where: { stock: { gte: 6 } },
    include: { product: true },
    take: 2,
  });

  if (variantes.length < 2) {
    throw new Error("Hacen falta dos variantes con stock para esta prueba.");
  }
  const [varianteA, varianteB] = variantes;
  const stockOriginalA = varianteA.stock;

  // --- 1. Un invitado puede armar su carrito
  const sumarAlInvitado = await agregarAlCarrito(invitado, varianteA.id, 2);
  verificar(
    "un invitado puede agregar al carrito sin tener cuenta",
    sumarAlInvitado.ok && sumarAlInvitado.cantidad === 2,
  );
  verificar(
    "el carrito del invitado se cuenta por su token",
    (await contarUnidades(invitado)) === 2,
  );
  verificar(
    "y no aparece en el carrito de la cuenta",
    (await contarUnidades(deLaCuenta)) === 0,
  );

  // --- 2. La cantidad se topa contra el stock
  const exagerado = await agregarAlCarrito(invitado, varianteA.id, 999);
  verificar(
    "pedir más que el stock deja el stock disponible, no más",
    exagerado.ok && exagerado.cantidad === stockOriginalA,
    `esperado ${stockOriginalA}, recibido ${exagerado.ok ? exagerado.cantidad : "error"}`,
  );

  // --- 3. Un dueño no puede tocar el carrito de otro
  const itemDelInvitado = (await itemsDelCarrito(invitado))[0];
  const tocadoPorOtro = await actualizarCantidad(deLaCuenta, itemDelInvitado.id, 1);
  verificar(
    "cambiar la cantidad de un ítem ajeno no hace nada",
    tocadoPorOtro === false,
  );
  await quitarDelCarrito(deLaCuenta, itemDelInvitado.id);
  verificar(
    "quitarlo desde otra cuenta tampoco lo borra",
    (await contarUnidades(invitado)) === stockOriginalA,
  );

  // --- 4. Fusión con una variante repetida: se suman las cantidades
  // El invitado ya tiene varianteA llena (== stock). La cuenta también.
  await agregarAlCarrito(deLaCuenta, varianteA.id, 2);
  await agregarAlCarrito(invitado, varianteB.id, 3);

  const antesUsuario = await contarUnidades(deLaCuenta);
  const antesInvitado = await contarUnidades(invitado);

  const fusionados = await fusionarCarritoDeInvitado(TOKEN_INVITADO, usuario.id);

  verificar(
    "la fusión informa cuántos ítems movió",
    fusionados === 2,
    `recibido ${fusionados}`,
  );
  verificar(
    "el carrito de invitado queda vacío",
    (await contarUnidades(invitado)) === 0,
  );
  verificar(
    "el carrito del invitado ya no tiene dueño por token",
    (await prisma.cartItem.count({ where: { cartToken: TOKEN_INVITADO } })) === 0,
  );
  verificar(
    "ni se duplicaron ni se perdieron unidades más allá del stock",
    (await contarUnidades(deLaCuenta)) === stockOriginalA + 3,
    `antes ${antesUsuario + antesInvitado}, después ${await contarUnidades(deLaCuenta)}`,
  );
  verificar(
    "la variante repetida no quedó en dos líneas",
    (await itemsDelCarrito(deLaCuenta)).length === 2,
  );
  verificar(
    "todos los ítems tienen ahora al usuario como dueño",
    (await prisma.cartItem.count({
      where: { userId: usuario.id, cartToken: null },
    })) === 2,
  );

  // --- 5. Fusión cuando la variante no estaba en la cuenta
  await limpiar();
  await agregarAlCarrito(invitado, varianteA.id, 1);
  await agregarAlCarrito(invitado, varianteB.id, 1);
  await fusionarCarritoDeInvitado(TOKEN_INVITADO, usuario.id);

  const trasFusion = await itemsDelCarrito(deLaCuenta);
  verificar(
    "sin repetidos, las dos líneas pasan tal cual",
    trasFusion.length === 2 &&
      trasFusion.every((i) => i.quantity === 1 && i.cartToken === null),
  );

  // --- 6. La limpieza de carritos viejos no toca los de la cuenta
  // Se vacía primero: si no, crear otra línea de varianteA para el usuario
  // chocaría con la clave única (userId, variantId).
  await limpiar();

  const ahora = new Date();
  const hace40dias = new Date(ahora.getTime() - 40 * 24 * 60 * 60 * 1000);

  const viejoDelInvitado = await prisma.cartItem.create({
    data: {
      cartToken: TOKEN_VIEJO,
      variantId: varianteA.id,
      quantity: 1,
    },
  });
  await prisma.cartItem.update({
    where: { id: viejoDelInvitado.id },
    data: { actualizadoEn: hace40dias },
  });

  const userIdViejo = await prisma.cartItem.create({
    data: { userId: usuario.id, variantId: varianteA.id, quantity: 1 },
  });
  await prisma.cartItem.update({
    where: { id: userIdViejo.id },
    data: { actualizadoEn: hace40dias },
  });

  // Un carrito de invitado viejo pero con actividad reciente NO se borra.
  const recienteDelInvitado = await prisma.cartItem.create({
    data: {
      cartToken: TOKEN_RECIENTE,
      variantId: varianteB.id,
      quantity: 1,
    },
  });

  const borrados = await limpiarCarritosDeInvitadoViejos(30);

  verificar("se borra el carrito de invitado viejo", borrados === 1, `borrados ${borrados}`);
  verificar(
    "NO se borra el ítem viejo del usuario (es su carrito, no basura)",
    (await prisma.cartItem.findUnique({ where: { id: userIdViejo.id } })) !== null,
  );
  verificar(
    "NO se borra un carrito de invitado con actividad reciente",
    (await prisma.cartItem.findUnique({
      where: { id: recienteDelInvitado.id },
    })) !== null,
  );

  // --- Limpieza
  await limpiar();
  await prisma.user.delete({ where: { id: usuario.id } });

  console.log(
    fallos === 0
      ? "\nTodo bien: el carrito de invitado y la fusión funcionan como se espera."
      : `\n${fallos} comprobación(es) fallaron.`,
  );

  await prisma.$disconnect();
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
