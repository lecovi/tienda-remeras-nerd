import nodemailer, { type Transporter } from "nodemailer";

import type { Mensaje, ProveedorDeEmail } from "@/lib/email/tipos";

/**
 * Proveedor SMTP genérico.
 *
 * Sirve para casi cualquier servicio (Resend, SendGrid, Gmail, Amazon SES,
 * Mailgun, el SMTP del hosting). Cambiar de servicio son variables de entorno,
 * no código.
 */
export function crearProveedorSMTP(): ProveedorDeEmail | null {
  const host = process.env.SMTP_HOST;
  const puerto = Number(process.env.SMTP_PORT ?? 587);
  const usuario = process.env.SMTP_USER;
  const clave = process.env.SMTP_PASSWORD;

  if (!host || !usuario || !clave) return null;

  // SMTP_SECURE manda si está definido; si no, se deduce del puerto: el 465
  // usa TLS desde el arranque y el 587/25 negocian con STARTTLS.
  const seguro =
    process.env.SMTP_SECURE !== undefined && process.env.SMTP_SECURE !== ""
      ? process.env.SMTP_SECURE === "true"
      : puerto === 465;

  let transporte: Transporter | null = null;

  return {
    nombre: "smtp",
    async enviar(mensaje: Mensaje) {
      // El transporte se crea una sola vez, en el primer envío: así no se
      // abre una conexión en cada arranque del proceso.
      transporte ??= nodemailer.createTransport({
        host,
        port: puerto,
        secure: seguro,
        auth: { user: usuario, pass: clave },
      });

      await transporte.sendMail({
        from: process.env.EMAIL_FROM ?? usuario,
        to: mensaje.para,
        subject: mensaje.asunto,
        html: mensaje.html,
        text: mensaje.texto,
      });
    },
  };
}
