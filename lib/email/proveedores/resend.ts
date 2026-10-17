import type { Mensaje, ProveedorDeEmail } from "@/lib/email/tipos";

/**
 * Proveedor Resend (API HTTP).
 *
 * Se usa fetch en lugar del SDK para no sumar una dependencia: la API es un
 * único POST. Si Resend cambia algo, se toca solo este archivo.
 */
export function crearProveedorResend(): ProveedorDeEmail | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const remitente = process.env.EMAIL_FROM;
  if (!remitente) {
    console.warn(
      "[email] RESEND_API_KEY está definido pero falta EMAIL_FROM; Resend no envía sin remitente verificado.",
    );
    return null;
  }

  return {
    nombre: "resend",
    async enviar(mensaje: Mensaje) {
      const respuesta = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: remitente,
          to: [mensaje.para],
          subject: mensaje.asunto,
          html: mensaje.html,
          text: mensaje.texto,
        }),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.text();
        throw new Error(
          `Resend respondió ${respuesta.status}: ${detalle.slice(0, 300)}`,
        );
      }
    },
  };
}
