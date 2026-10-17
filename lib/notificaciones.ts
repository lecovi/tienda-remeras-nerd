import "server-only";

import { enviar, proveedorActual } from "@/lib/email";
import {
  plantillaBienvenida,
  plantillaCarritoAbandonado,
  plantillaCompraConfirmada,
  plantillaPedidoEnviado,
  type ItemParaMail,
} from "@/lib/email/plantillas";
import { prisma } from "@/lib/prisma";
import { urlDelSitio } from "@/lib/mercadopago";

/**
 * Notificaciones por email.
 *
 * Todo el envío pasa por acá para que los llamadores no sepan nada de
 * plantillas ni de proveedores, y para tener un único lugar donde ver qué
 * mails manda el sistema.
 *
 * Ninguna de estas funciones lanza: si el email falla, se registra y la
 * operación de negocio (confirmar un pago, marcar enviado) sigue en pie.
 */

function numeroCorto(id: string): string {
  return id.slice(-8).toUpperCase();
}

export async function notificarBienvenida(userId: string): Promise<void> {
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario?.email) return;

  const { asunto, html, texto } = plantillaBienvenida(
    usuario.name,
    `${urlDelSitio()}/catalogo`,
  );

  await enviar({ para: usuario.email, asunto, html, texto });
}

export async function notificarCompraConfirmada(orderId: string): Promise<void> {
  const pedido = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (!pedido?.user?.email) return;

  const items: ItemParaMail[] = pedido.items.map((i) => ({
    productName: i.productName,
    size: i.size,
    color: i.color,
    quantity: i.quantity,
    unitCents: i.unitCents,
  }));

  const { asunto, html, texto } = plantillaCompraConfirmada(
    numeroCorto(pedido.id),
    items,
    pedido.totalCents,
    `${urlDelSitio()}/cuenta/pedidos`,
  );

  await enviar({ para: pedido.user.email, asunto, html, texto });
}

export async function notificarPedidoEnviado(orderId: string): Promise<void> {
  const pedido = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!pedido?.user?.email) return;

  const { asunto, html, texto } = plantillaPedidoEnviado(
    numeroCorto(pedido.id),
    `${urlDelSitio()}/cuenta/pedidos`,
    pedido.trackingCode ?? undefined,
  );

  await enviar({ para: pedido.user.email, asunto, html, texto });
}

/**
 * Recordatorio de carrito abandonado.
 *
 * Un carrito se considera abandonado si tiene ítems y no se tocó en las
 * últimas `horasMinimas` horas. Se limita a un recordatorio por carrito
 * usando CartItem.recordatorioEnviadoEn, para no mandar el mismo mail todos
 * los días (y que no nos marquen como spam).
 */
export async function notificarCarritosAbandonados(
  horasMinimas = 24,
): Promise<{ enviados: number; revisados: number }> {
  const limite = new Date(Date.now() - horasMinimas * 60 * 60 * 1000);

  const usuarios = await prisma.user.findMany({
    where: {
      cartItems: {
        some: {
          actualizadoEn: { lt: limite },
          recordatorioEnviadoEn: null,
        },
      },
    },
    include: {
      // Solo se listan los ítems quietos: si el usuario tocó uno hace un rato,
      // no tiene sentido recordárselo ni marcarlo como notificado.
      cartItems: {
        where: {
          actualizadoEn: { lt: limite },
          recordatorioEnviadoEn: null,
        },
        include: { variant: { include: { product: true } } },
      },
    },
  });

  let enviados = 0;

  for (const usuario of usuarios) {
    // Sin email no hay a dónde mandar; se marcan igual para no revisarlos siempre.
    if (usuario.email && usuario.cartItems.length > 0) {
      const items: ItemParaMail[] = usuario.cartItems.map((i) => ({
        productName: i.variant.product.name,
        size: i.variant.size,
        color: i.variant.color,
        quantity: i.quantity,
        unitCents: i.variant.product.priceCents,
      }));

      const { asunto, html, texto } = plantillaCarritoAbandonado(
        items,
        `${urlDelSitio()}/carrito`,
      );

      const ok = await enviar({ para: usuario.email, asunto, html, texto });
      if (ok) enviados++;
    }

    await prisma.cartItem.updateMany({
      where: { id: { in: usuario.cartItems.map((i) => i.id) } },
      data: { recordatorioEnviadoEn: new Date() },
    });
  }

  return { enviados, revisados: usuarios.length };
}

/** Para el panel: saber si los mails están saliendo de verdad. */
export function proveedorDeEmail(): string {
  return proveedorActual().nombre;
}
