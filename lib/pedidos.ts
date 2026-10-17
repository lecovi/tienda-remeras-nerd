import "server-only";

import { itemsDelCarrito, totalCarrito } from "@/lib/carrito";
import type { OpcionDeEnvio } from "@/lib/envio";
import { prisma } from "@/lib/prisma";

export type PedidoConItems = Awaited<ReturnType<typeof pedidosDelUsuario>>[number];

/**
 * Convierte el carrito en un pedido PENDING.
 *
 * Recibe un userId y no un "dueño de carrito" a propósito: un pedido siempre
 * tiene dueño, y por eso el checkout exige sesión. El carrito de invitado sirve
 * para armar la compra, pero al pagar hay que entrar (y al entrar, ese carrito
 * se fusiona con el de la cuenta: ver fusionarCarritoDeInvitado).
 *
 * La opción de envío llega ya resuelta por el servidor (ver resolverOpcionDeEnvio),
 * nunca con un precio que venga del navegador.
 *
 * El stock NO se descuenta acá: se descuenta recién cuando el pago se confirma.
 * Así, un carrito que nunca se paga no bloquea unidades para otros compradores.
 * La contra es que puede haber sobreventa si dos personas pagan a la vez; por
 * eso confirmarPago vuelve a validar y topa el stock en cero.
 */
export async function crearPedidoDesdeCarrito(
  userId: string,
  opcionEnvio: OpcionDeEnvio,
) {
  const items = await itemsDelCarrito({ tipo: "usuario", userId });

  if (items.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  const sinStock = items.find((i) => i.variant.stock < i.quantity);
  if (sinStock) {
    throw new Error(
      `No hay stock suficiente de ${sinStock.variant.product.name} (talle ${sinStock.variant.size}, ${sinStock.variant.color}).`,
    );
  }

  const totalItems = totalCarrito(items);

  return prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      totalCents: totalItems + opcionEnvio.costoCentavos,
      shippingCents: opcionEnvio.costoCentavos,
      shippingMethod: opcionEnvio.nombre,
      items: {
        create: items.map((i) => ({
          variantId: i.variantId,
          // Se copian los datos del producto: si mañana cambia el precio
          // o se borra la variante, el pedido histórico queda intacto.
          productName: i.variant.product.name,
          size: i.variant.size,
          color: i.variant.color,
          quantity: i.quantity,
          unitCents: i.variant.product.priceCents,
        })),
      },
    },
  });
}

/**
 * Marca un pedido como pagado, descuenta stock y vacía el carrito.
 *
 * Es idempotente: MercadoPago puede notificar el mismo pago varias veces
 * (webhook + retorno del usuario), y la segunda vez no debe volver a descontar.
 */
export async function confirmarPago(orderId: string, mpPaymentId?: string) {
  return prisma.$transaction(async (tx) => {
    const pedido = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!pedido) throw new Error(`Pedido ${orderId} inexistente.`);

    // Ya estaba pagado: no se toca el stock de nuevo.
    if (pedido.status !== "PENDING") {
      return { yaEstaba: true, pedido };
    }

    for (const item of pedido.items) {
      if (!item.variantId) continue;

      const variante = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variante) continue;

      // Se topa en cero en lugar de dejar stock negativo: si hubo sobreventa,
      // el backoffice lo ve como faltante y lo resuelve a mano.
      const nuevoStock = Math.max(0, variante.stock - item.quantity);
      await tx.productVariant.update({
        where: { id: variante.id },
        data: { stock: nuevoStock },
      });
    }

    const actualizado = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        ...(mpPaymentId ? { mpPaymentId } : {}),
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { userId: pedido.userId } });

    return { yaEstaba: false, pedido: actualizado };
  });
}

export async function pedidosDelUsuario(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenerPedidoDelUsuario(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
}

/** Pedidos por estado, para el backoffice. */
export async function pedidosPorEstado(estados: string[]) {
  return prisma.order.findMany({
    where: { status: { in: estados } },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
