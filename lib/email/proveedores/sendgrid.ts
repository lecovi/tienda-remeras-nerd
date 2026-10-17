import type { Mensaje, ProveedorDeEmail } from "@/lib/email/tipos";

/**
 * Proveedor SendGrid (API HTTP v3).
 *
 * Igual que Resend: fetch directo para no sumar dependencia.
 */
export function crearProveedorSendGrid(): ProveedorDeEmail | null {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;

  const remitente = process.env.EMAIL_FROM;
  if (!remitente) {
    console.warn(
      "[email] SENDGRID_API_KEY está definido pero falta EMAIL_FROM; SendGrid no envía sin remitente verificado.",
    );
    return null;
  }

  return {
    nombre: "sendgrid",
    async enviar(mensaje: Mensaje) {
      const respuesta = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: mensaje.para }] }],
          from: { email: remitente },
          subject: mensaje.asunto,
          content: [
            ...(mensaje.texto
              ? [{ type: "text/plain", value: mensaje.texto }]
              : []),
            { type: "text/html", value: mensaje.html },
          ],
        }),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.text();
        throw new Error(
          `SendGrid respondió ${respuesta.status}: ${detalle.slice(0, 300)}`,
        );
      }
    },
  };
}
