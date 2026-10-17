import type { NextRequest } from "next/server";
import { NextResponse, after } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";

import { pagos } from "@/lib/mercadopago";
import { notificarCompraConfirmada } from "@/lib/notificaciones";
import { confirmarPago } from "@/lib/pedidos";

/**
 * Webhook de MercadoPago.
 *
 * Reglas que sigue este handler:
 * 1. La firma se valida SIEMPRE con WebhookSignatureValidator. Sin esto
 *    cualquiera podría pegarle al endpoint y marcar pedidos como pagados.
 * 2. Se responde 200 a los eventos que no son de pago, para que MercadoPago
 *    no reintente eternamente algo que no nos interesa.
 * 3. La confirmación es idempotente (ver confirmarPago): el mismo pago puede
 *    llegar varias veces y también desde la back_url.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dataId = searchParams.get("data.id") ?? searchParams.get("id");
  const tipo = searchParams.get("type") ?? searchParams.get("topic");

  const secreto = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secreto) {
    // Sin secreto no hay forma de distinguir una notificación real de un
    // pedido falso, así que se rechaza en lugar de confiar a ciegas.
    console.error(
      "[webhook] falta MERCADOPAGO_WEBHOOK_SECRET: se rechaza la notificación",
    );
    return NextResponse.json(
      { error: "Webhook no configurado" },
      { status: 500 },
    );
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret: secreto,
      // 5 minutos de tolerancia contra reenvíos de una notificación capturada.
      toleranceSeconds: 300,
    });
  } catch (error) {
    const motivo = (error as { reason?: string }).reason ?? "desconocido";
    console.warn(`[webhook] firma inválida (${motivo})`);
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // Otros eventos (merchant_order, etc.) se aceptan y se ignoran.
  if (tipo !== "payment" || !dataId) {
    return NextResponse.json({ ok: true, ignorado: tipo ?? "sin tipo" });
  }

  try {
    const pago = await pagos().get({ id: dataId });

    if (pago.status === "approved" && pago.external_reference) {
      const resultado = await confirmarPago(
        pago.external_reference,
        pago.id ? String(pago.id) : undefined,
      );
      console.log(
        `[webhook] pedido ${pago.external_reference} pagado` +
          (resultado.yaEstaba ? " (ya estaba registrado)" : ""),
      );

      // El mail se manda después de responder, para que MercadoPago reciba el
      // 200 cuanto antes y no reintente. Y solo si el pago es nuevo: si ya
      // estaba registrado, el cliente ya lo recibió.
      if (!resultado.yaEstaba) {
        const referencia = pago.external_reference;
        after(() => notificarCompraConfirmada(referencia));
      }
    }
  } catch (error) {
    // Se responde 500 para que MercadoPago reintente: puede ser un fallo
    // transitorio nuestro, no un problema de la notificación.
    console.error("[webhook] error procesando el pago:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
