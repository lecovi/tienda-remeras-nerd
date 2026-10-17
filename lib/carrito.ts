import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Núcleo del carrito: operaciones sobre la base.
 *
 * Acá NO se lee la sesión ni las cookies. A propósito: `auth.ts` necesita
 * fusionar el carrito de invitado justo cuando el usuario entra, y si este
 * módulo importara lib/sesion (que importa auth.ts) se armaría un ciclo de
 * imports. Resolver "quién está comprando" es responsabilidad de lib/sesion.
 */

/** Nombre de la cookie que identifica el carrito de un invitado. */
export const COOKIE_CARRITO = "carrito_invitado";

/**
 * De quién es el carrito.
 *
 * Un carrito pertenece a un usuario logueado o a un invitado identificado por
 * una cookie. Nunca a los dos: al iniciar sesión, el carrito de invitado se
 * fusiona con el del usuario y la cookie deja de tener ítems.
 */
export type DuenoCarrito =
  | { tipo: "usuario"; userId: string }
  | { tipo: "invitado"; cartToken: string };

/** Filtro de Prisma equivalente a "los ítems de este dueño". */
function deQuien(dueno: DuenoCarrito) {
  return dueno.tipo === "usuario"
    ? { userId: dueno.userId }
    : { cartToken: dueno.cartToken };
}

/**
 * Atajo para el carrito de alguien logueado.
 *
 * Se usa donde la sesión ya es obligatoria (checkout, pedidos): ahí no hay
 * ambigüedad sobre de quién es el carrito.
 */
export function carritoDeUsuario(userId: string): DuenoCarrito {
  return { tipo: "usuario", userId };
}

export async function itemsDelCarrito(dueno: DuenoCarrito | null) {
  if (!dueno) return [];

  return prisma.cartItem.findMany({
    where: deQuien(dueno),
    include: {
      variant: { include: { product: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type ItemCarrito = Awaited<ReturnType<typeof itemsDelCarrito>>[number];

/** Suma de unidades (no de líneas): es lo que se muestra en el ícono del carrito. */
export async function contarUnidades(
  dueno: DuenoCarrito | null,
): Promise<number> {
  if (!dueno) return 0;

  const resultado = await prisma.cartItem.aggregate({
    where: deQuien(dueno),
    _sum: { quantity: true },
  });

  return resultado._sum.quantity ?? 0;
}

export function totalCarrito(items: ItemCarrito[]): number {
  return items.reduce(
    (acc, item) => acc + item.variant.product.priceCents * item.quantity,
    0,
  );
}

export function unidadesCarrito(items: ItemCarrito[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

// ---------------------------------------------------------------- Mutaciones

export type ResultadoCarrito =
  | { ok: true; cantidad: number }
  | { ok: false; error: string };

/**
 * Agrega unidades de una variante y devuelve la cantidad final.
 *
 * La cantidad se topa contra el stock real: si pide 3 y quedan 2, quedan 2. El
 * stock no se descuenta acá, se descuenta al confirmar el pago (ver
 * lib/pedidos.ts), así un carrito abandonado no bloquea unidades.
 */
export async function agregarAlCarrito(
  dueno: DuenoCarrito,
  variantId: string,
  cantidad: number,
): Promise<ResultadoCarrito> {
  const variante = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variante || !variante.product.isActive) {
    return { ok: false, error: "Ese producto ya no está disponible." };
  }
  if (variante.stock < 1) {
    return { ok: false, error: "No queda stock de esa combinación de talle y color." };
  }

  const existente = await prisma.cartItem.findFirst({
    where: { ...deQuien(dueno), variantId },
  });

  const cantidadFinal = Math.min(
    (existente?.quantity ?? 0) + cantidad,
    variante.stock,
  );

  // Al volver a agregar, el carrito deja de estar abandonado: se limpia el
  // recordatorio para que más adelante se le pueda volver a avisar.
  const datos = { quantity: cantidadFinal, recordatorioEnviadoEn: null };

  if (existente) {
    await prisma.cartItem.update({ where: { id: existente.id }, data: datos });
    return { ok: true, cantidad: cantidadFinal };
  }

  await prisma.cartItem.create({
    data: {
      // La invariante "exactamente un dueño" se sostiene acá y solo acá.
      ...(dueno.tipo === "usuario"
        ? { userId: dueno.userId }
        : { cartToken: dueno.cartToken }),
      variantId,
      ...datos,
    },
  });

  return { ok: true, cantidad: cantidadFinal };
}

/**
 * Cambia la cantidad de una línea del carrito.
 *
 * El filtro incluye al dueño a propósito: sin eso, cualquiera con un itemId
 * ajeno podría tocar el carrito de otra persona.
 */
export async function actualizarCantidad(
  dueno: DuenoCarrito,
  itemId: string,
  cantidad: number,
): Promise<boolean> {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, ...deQuien(dueno) },
    include: { variant: true },
  });

  if (!item) return false;

  if (cantidad < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return true;
  }

  // Se topa contra el stock. Si el stock cayó a cero desde que se agregó, una
  // cantidad de 0 sería un estado inválido: se saca la línea.
  const tope = Math.min(cantidad, item.variant.stock);

  if (tope < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return true;
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: {
      quantity: tope,
      // Modificar el carrito lo saca del estado "abandonado".
      recordatorioEnviadoEn: null,
    },
  });

  return true;
}

export async function quitarDelCarrito(
  dueno: DuenoCarrito,
  itemId: string,
): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: { id: itemId, ...deQuien(dueno) },
  });
}

// ---------------------------------------------------------------- Fusión

/**
 * Pasa los ítems del carrito de invitado al carrito del usuario.
 *
 * Se llama cuando alguien inicia sesión: lo que armó sin cuenta viaja con él.
 *
 * El caso con detalle es cuando el usuario YA tenía esa variante en su carrito:
 * las cantidades se suman (topadas por el stock), porque el invitado y el
 * usuario son la misma persona.
 */
export async function fusionarCarritoDeInvitado(
  cartToken: string,
  userId: string,
): Promise<number> {
  const delInvitado = await prisma.cartItem.findMany({
    where: { cartToken },
    include: { variant: true },
  });

  if (delInvitado.length === 0) return 0;

  let fusionados = 0;

  for (const item of delInvitado) {
    const existente = await prisma.cartItem.findFirst({
      where: { userId, variantId: item.variantId },
    });

    if (!existente) {
      // Nada que sumar: la línea se transfiere tal cual y pierde el token.
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { userId, cartToken: null },
      });
    } else {
      const tope = Math.min(
        existente.quantity + item.quantity,
        item.variant.stock,
      );

      if (tope < 1) {
        // La variante se quedó sin stock mientras tanto: no tiene sentido
        // dejar una línea de 0 unidades.
        await prisma.cartItem.delete({ where: { id: existente.id } });
      } else {
        await prisma.cartItem.update({
          where: { id: existente.id },
          data: { quantity: tope, recordatorioEnviadoEn: null },
        });
      }

      await prisma.cartItem.delete({ where: { id: item.id } });
    }

    fusionados++;
  }

  return fusionados;
}

/**
 * Borra los carritos de invitado sin tocar por más de `dias`.
 *
 * Sin esto, la tabla se llena de carritos de gente que miró una remera y nunca
 * volvió: no tienen email, así que el recordatorio de carrito abandonado no los
 * toca, y se acumulan para siempre. Se llama desde la tarea programada.
 */
export async function limpiarCarritosDeInvitadoViejos(
  dias = 30,
): Promise<number> {
  const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const resultado = await prisma.cartItem.deleteMany({
    where: { cartToken: { not: null }, actualizadoEn: { lt: limite } },
  });

  return resultado.count;
}
