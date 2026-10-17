"use server";

import { redirect } from "next/navigation";

import { carritoDeUsuario, itemsDelCarrito, totalCarrito } from "@/lib/carrito";
import { resolverOpcionDeEnvio } from "@/lib/envio";
import { estaConfigurado, preferences, urlDelSitio } from "@/lib/mercadopago";
import { crearPedidoDesdeCarrito } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { requerirUsuario } from "@/lib/sesion";

export type EstadoCheckout = { error?: string };

/**
 * Crea el pedido y la preferencia de pago, y manda al usuario a MercadoPago.
 *
 * El pedido queda en PENDING: recién se marca PAID cuando llega el webhook
 * (o cuando el usuario vuelve por la back_url y se consulta el pago).
 */
export async function iniciarPago(
  _estado: EstadoCheckout,
  formData: FormData,
): Promise<EstadoCheckout> {
  const usuario = await requerirUsuario();

  if (!estaConfigurado()) {
    return {
      error:
        "MercadoPago no está configurado. Cargá MERCADOPAGO_ACCESS_TOKEN en el archivo .env para probar el pago.",
    };
  }

  const items = await itemsDelCarrito(carritoDeUsuario(usuario.id));
  if (items.length === 0) {
    return { error: "Tu carrito está vacío." };
  }

  const totalItems = totalCarrito(items);

  // El navegador manda solo el id de la opción ("domicilio"); el costo se
  // vuelve a calcular acá para que no se pueda manipular desde el formulario.
  const opcionEnvio = await resolverOpcionDeEnvio(
    typeof formData.get("envio") === "string"
      ? (formData.get("envio") as string)
      : undefined,
    totalItems,
  );

  let initPoint: string | null = null;

  try {
    const pedido = await crearPedidoDesdeCarrito(usuario.id, opcionEnvio);
    const base = urlDelSitio();

    const preferencia = await preferences().create({
      body: {
        items: [
          ...items.map((i) => ({
            id: i.variantId,
            title: `${i.variant.product.name} - Talle ${i.variant.size} ${i.variant.color}`,
            quantity: i.quantity,
            // MercadoPago espera pesos, no centavos.
            unit_price: i.variant.product.priceCents / 100,
            currency_id: "ARS",
          })),
          // El envío tiene que ir como ítem para que el monto de la preferencia
          // coincida exactamente con el total del pedido.
          ...(opcionEnvio.costoCentavos > 0
            ? [
                {
                  id: `envio-${opcionEnvio.id}`,
                  title: `Envío: ${opcionEnvio.nombre}`,
                  quantity: 1,
                  unit_price: opcionEnvio.costoCentavos / 100,
                  currency_id: "ARS",
                },
              ]
            : []),
        ],
        // Permite conciliar el pago con el pedido cuando llegue el webhook.
        external_reference: pedido.id,
        payer: { email: usuario.email ?? undefined },
        statement_descriptor: "NERDWEAR",
        notification_url: `${base}/api/mercadopago/webhook`,
        back_urls: {
          success: `${base}/checkout/resultado?pedido=${pedido.id}`,
          pending: `${base}/checkout/resultado?pedido=${pedido.id}`,
          failure: `${base}/checkout/resultado?pedido=${pedido.id}`,
        },
        // auto_return exige back_urls públicas: en localhost MercadoPago lo
        // rechaza, así que solo se envía si el sitio no es local.
        ...(base.includes("localhost") ? {} : { auto_return: "approved" as const }),
      },
    });

    await prisma.order.update({
      where: { id: pedido.id },
      data: { mpPreferenceId: preferencia.id },
    });

    initPoint = preferencia.init_point ?? null;
  } catch (error) {
    console.error("[checkout] falló la creación de la preferencia:", error);
    return {
      error:
        "No pudimos iniciar el pago. Intentá de nuevo en unos minutos; si sigue fallando, escribinos por WhatsApp.",
    };
  }

  if (!initPoint) {
    return { error: "MercadoPago no devolvió una URL de pago." };
  }

  // Fuera del try: redirect lanza un error especial de Next que no se atrapa.
  redirect(initPoint);
}
