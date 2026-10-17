import { formatearPrecio } from "@/lib/formato";

/**
 * Plantillas de email.
 *
 * Los clientes de correo (Outlook sobre todo) no soportan hojas de estilo
 * externas ni buena parte de CSS moderno, así que todo va con estilos en
 * línea y maquetado con tablas. No es bonito de leer, es lo que funciona.
 */

const MARCA = "#6d28d9";
const ACENTO = "#c8f531";
const TINTA = "#0f0f12";
const GRIS = "#52525b";

function layout(titulo: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:#f6f6f7;font-family:Arial,Helvetica,sans-serif;color:${TINTA};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:${TINTA};padding:20px 24px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">Nerd&nbsp;Wear</span>
          </td>
        </tr>
        <tr><td style="background:${ACENTO};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 24px;">${cuerpo}</td></tr>
        <tr>
          <td style="padding:20px 24px;background:#f6f6f7;color:${GRIS};font-size:12px;line-height:1.6;">
            Nerd Wear · Remeras de cultura pop<br>
            Lunes a viernes de 9 a 18 h · hola@nerdwear.com.ar
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function boton(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:${MARCA};border-radius:8px;">
      <a href="${url}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:bold;font-size:14px;text-decoration:none;">${texto}</a>
    </td></tr>
  </table>`;
}

// ------------------------------------------------------------------ Bienvenida

export function plantillaBienvenida(nombre: string | null, urlCatalogo: string) {
  const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";

  return {
    asunto: "Bienvenido a Nerd Wear",
    texto: `${saludo} Ya tenés tu cuenta. Pasá por el catálogo: ${urlCatalogo}`,
    html: layout(
      "Bienvenido a Nerd Wear",
      `<h1 style="margin:0 0 16px;font-size:22px;">${saludo}</h1>
       <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${GRIS};">
         Ya tenés tu cuenta creada. Desde ahora podés guardar tu carrito, seguir tus
         pedidos y elegir más rápido tus medios de pago.
       </p>
       <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${GRIS};">
         Tenemos remeras de videojuegos, cómics, animé y retro, con estampas que duran.
       </p>
       ${boton("Ver el catálogo", urlCatalogo)}`,
    ),
  };
}

// ------------------------------------------------------------------ Compra confirmada

export type ItemParaMail = {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitCents: number;
};

function tablaItems(items: ItemParaMail[]): string {
  const filas = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;font-size:14px;border-bottom:1px solid #e4e4e7;">
          ${i.quantity}× ${i.productName}
          <span style="color:${GRIS};font-size:12px;">(Talle ${i.size} · ${i.color})</span>
        </td>
        <td style="padding:8px 0;font-size:14px;text-align:right;border-bottom:1px solid #e4e4e7;white-space:nowrap;">
          ${formatearPrecio(i.unitCents * i.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${filas}</table>`;
}

export function plantillaCompraConfirmada(
  numeroPedido: string,
  items: ItemParaMail[],
  totalCents: number,
  urlPedidos: string,
) {
  const listado = items
    .map((i) => `- ${i.quantity}x ${i.productName} (Talle ${i.size} · ${i.color})`)
    .join("\n");

  return {
    asunto: `Confirmamos tu compra #${numeroPedido}`,
    texto: `¡Gracias por tu compra!\n\nPedido #${numeroPedido}\n${listado}\n\nTotal: ${formatearPrecio(totalCents)}\n\nVer el detalle: ${urlPedidos}`,
    html: layout(
      "Compra confirmada",
      `<h1 style="margin:0 0 8px;font-size:22px;">¡Gracias por tu compra!</h1>
       <p style="margin:0 0 4px;font-size:14px;color:${GRIS};">
         Confirmamos el pago de tu pedido
         <strong style="color:${TINTA};">#${numeroPedido}</strong>.
       </p>
       ${tablaItems(items)}
       <p style="margin:16px 0 0;font-size:16px;font-weight:bold;text-align:right;">
         Total: ${formatearPrecio(totalCents)}
       </p>
       <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:${GRIS};">
         Estamos preparando tu pedido. Te avisamos por este medio cuando salga.
       </p>
       ${boton("Ver mis pedidos", urlPedidos)}`,
    ),
  };
}

// ------------------------------------------------------------------ Pedido enviado

export function plantillaPedidoEnviado(
  numeroPedido: string,
  urlPedidos: string,
  seguimiento?: string,
) {
  return {
    asunto: `Tu pedido #${numeroPedido} salió`,
    texto: `Tu pedido #${numeroPedido} ya está en camino.${seguimiento ? `\nSeguimiento: ${seguimiento}` : ""}\n\n${urlPedidos}`,
    html: layout(
      "Pedido enviado",
      `<h1 style="margin:0 0 12px;font-size:22px;">Tu pedido salió 📦</h1>
       <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${GRIS};">
         El pedido <strong style="color:${TINTA};">#${numeroPedido}</strong>
         ya está en camino. Según tu zona, puede demorar entre 3 y 7 días hábiles.
       </p>
       ${
         seguimiento
           ? `<p style="margin:0 0 16px;font-size:14px;">
                Código de seguimiento: <strong>${seguimiento}</strong>
              </p>`
           : ""
       }
       ${boton("Ver mis pedidos", urlPedidos)}`,
    ),
  };
}

// ------------------------------------------------------------------ Acceso por email (link mágico)

/**
 * Mail con el link de acceso.
 *
 * Es el mail más sensible de todos: quien tenga el link entra a la cuenta sin
 * más. Por eso el texto dice explícitamente que vence y que sirve una sola vez,
 * y que si no lo pidió lo ignore.
 */
export function plantillaAcceso(url: string, expira: Date) {
  const minutos = Math.max(1, Math.round((expira.getTime() - Date.now()) / 60000));

  return {
    asunto: "Tu acceso a Nerd Wear",
    texto: `Entrá a tu cuenta con este link:\n\n${url}\n\nVence en ${minutos} minutos y sirve una sola vez. Si no lo pediste, ignorá este mensaje.`,
    html: layout(
      "Acceso a tu cuenta",
      `<h1 style="margin:0 0 12px;font-size:22px;">Tu link de acceso</h1>
       <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${GRIS};">
         Hacé clic en el botón para entrar a tu cuenta. No hace falta escribir
         ninguna contraseña.
       </p>
       ${boton("Entrar a mi cuenta", url)}
       <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${GRIS};">
         El link vence en <strong>${minutos} minutos</strong> y sirve una sola vez.
         Si no lo pediste, ignorá este mensaje: no pasa nada.
       </p>
       <p style="margin:0;font-size:12px;line-height:1.6;color:${GRIS};">
         Si el botón no funciona, copiá y pegá esta dirección en el navegador:<br>
         <span style="word-break:break-all;color:${MARCA};">${url}</span>
       </p>`,
    ),
  };
}

// ------------------------------------------------------------------ Carrito abandonado

export function plantillaCarritoAbandonado(
  items: ItemParaMail[],
  urlCarrito: string,
) {
  const listado = items
    .map((i) => `- ${i.quantity}x ${i.productName} (Talle ${i.size} · ${i.color})`)
    .join("\n");

  return {
    asunto: "Dejaste algo en el carrito",
    texto: `Te quedaron cosas sin comprar:\n${listado}\n\nTerminá tu compra: ${urlCarrito}`,
    html: layout(
      "Carrito abandonado",
      `<h1 style="margin:0 0 12px;font-size:22px;">Te quedó algo en el carrito</h1>
       <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${GRIS};">
         Guardamos tu selección, pero el stock no está reservado: puede agotarse.
       </p>
       ${tablaItems(items)}
       ${boton("Terminar mi compra", urlCarrito)}`,
    ),
  };
}
