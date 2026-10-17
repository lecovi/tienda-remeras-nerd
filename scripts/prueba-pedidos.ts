/**
 * Prueba de integración de la lógica de pedidos.
 *
 * Verifica lo que es fácil romper sin darse cuenta:
 *  - el pedido guarda una copia del producto (snapshot) y el total correcto
 *  - confirmar el pago descuenta stock y vacía el carrito
 *  - confirmar el pago DOS veces no descuenta stock dos veces (idempotencia)
 *
 * Se corre contra la base de desarrollo. Crea datos y los borra al final.
 *
 * Uso: npm run prueba:pedidos
 */
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import { resolverOpcionDeEnvio } from "../lib/envio";
import { crearPedidoDesdeCarrito, confirmarPago } from "../lib/pedidos";

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

async function main() {
  console.log("Probando el flujo de pedidos...\n");

  // --- Preparación: usuario de prueba y una variante con stock conocido
  const usuario = await prisma.user.upsert({
    where: { email: "prueba-pedidos@local" },
    update: {},
    create: { email: "prueba-pedidos@local", name: "Usuario de prueba" },
  });

  await prisma.cartItem.deleteMany({ where: { userId: usuario.id } });

  const variante = await prisma.productVariant.findFirstOrThrow({
    where: { stock: { gte: 5 } },
    include: { product: true },
  });

  const stockInicial = variante.stock;
  const CANTIDAD = 2;

  await prisma.cartItem.create({
    data: { userId: usuario.id, variantId: variante.id, quantity: CANTIDAD },
  });

  // --- 1. Crear el pedido
  const totalItems = variante.product.priceCents * CANTIDAD;
  const envio = await resolverOpcionDeEnvio("domicilio", totalItems);
  const pedido = await crearPedidoDesdeCarrito(usuario.id, envio);

  verificar("el pedido nace en PENDING", pedido.status === "PENDING");
  verificar(
    "el total es productos + envío",
    pedido.totalCents === totalItems + envio.costoCentavos,
    `esperado ${totalItems + envio.costoCentavos}, recibido ${pedido.totalCents}`,
  );
  verificar(
    "se guarda el costo de envío por separado",
    pedido.shippingCents === envio.costoCentavos,
    `esperado ${envio.costoCentavos}, recibido ${pedido.shippingCents}`,
  );
  verificar(
    "se guarda qué opción de envío eligió",
    pedido.shippingMethod === envio.nombre,
  );

  const item = await prisma.orderItem.findFirstOrThrow({
    where: { orderId: pedido.id },
  });
  verificar(
    "el ítem guarda el nombre del producto (snapshot)",
    item.productName === variante.product.name,
  );
  verificar("el ítem guarda talle y color", item.size === variante.size && item.color === variante.color);
  verificar(
    "crear el pedido NO descuenta stock todavía",
    (await prisma.productVariant.findUniqueOrThrow({ where: { id: variante.id } }))
      .stock === stockInicial,
  );

  // --- 2. Confirmar el pago
  await confirmarPago(pedido.id, "pago-de-prueba-123");

  const trasPagar = await prisma.order.findUniqueOrThrow({
    where: { id: pedido.id },
  });
  const varianteTrasPagar = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variante.id },
  });

  verificar("el pedido queda PAID", trasPagar.status === "PAID");
  verificar(
    "se guarda el id del pago de MercadoPago",
    trasPagar.mpPaymentId === "pago-de-prueba-123",
  );
  verificar(
    "el stock bajó exactamente la cantidad comprada",
    varianteTrasPagar.stock === stockInicial - CANTIDAD,
    `esperado ${stockInicial - CANTIDAD}, recibido ${varianteTrasPagar.stock}`,
  );
  verificar(
    "el carrito quedó vacío",
    (await prisma.cartItem.count({ where: { userId: usuario.id } })) === 0,
  );

  // --- 3. Idempotencia: MercadoPago puede notificar el mismo pago dos veces
  const segunda = await confirmarPago(pedido.id, "pago-de-prueba-123");
  const varianteTrasSegunda = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variante.id },
  });

  verificar("la segunda confirmación se detecta como repetida", segunda.yaEstaba);
  verificar(
    "el stock NO se descontó dos veces",
    varianteTrasSegunda.stock === stockInicial - CANTIDAD,
    `esperado ${stockInicial - CANTIDAD}, recibido ${varianteTrasSegunda.stock}`,
  );

  // --- Limpieza: la prueba no debe dejar rastro en la base de desarrollo
  await prisma.orderItem.deleteMany({ where: { orderId: pedido.id } });
  await prisma.order.delete({ where: { id: pedido.id } });
  await prisma.productVariant.update({
    where: { id: variante.id },
    data: { stock: stockInicial },
  });
  await prisma.cartItem.deleteMany({ where: { userId: usuario.id } });
  await prisma.user.delete({ where: { id: usuario.id } });

  console.log(
    fallos === 0
      ? "\nTodo bien: el flujo de pedidos funciona como se espera."
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
