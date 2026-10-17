import "server-only";

import { proveedorConsola } from "@/lib/email/proveedores/consola";
import { crearProveedorResend } from "@/lib/email/proveedores/resend";
import { crearProveedorSendGrid } from "@/lib/email/proveedores/sendgrid";
import { crearProveedorSMTP } from "@/lib/email/proveedores/smtp";
import type { ProveedorDeEmail } from "@/lib/email/tipos";

export type { Mensaje } from "@/lib/email/tipos";

/**
 * Elige el proveedor.
 *
 * EMAIL_PROVIDER fuerza uno en concreto (smtp | resend | sendgrid). Si no está
 * definido, se autodetecta por las credenciales presentes, en este orden:
 * Resend, SendGrid, SMTP. Si no hay ninguna, se cae a consola.
 *
 * El orden es deliberado: las APIs HTTP son más confiables que SMTP en
 * entornos serverless, donde las conexiones salientes se cortan.
 */
function elegirProveedor(): ProveedorDeEmail {
  const forzado = process.env.EMAIL_PROVIDER?.toLowerCase();

  const candidatos: Record<string, () => ProveedorDeEmail | null> = {
    resend: crearProveedorResend,
    sendgrid: crearProveedorSendGrid,
    smtp: crearProveedorSMTP,
  };

  if (forzado) {
    const creador = candidatos[forzado];
    if (!creador) {
      console.warn(
        `[email] EMAIL_PROVIDER="${forzado}" no es válido. Opciones: smtp, resend, sendgrid. Se usa consola.`,
      );
      return proveedorConsola;
    }
    return creador() ?? proveedorConsola;
  }

  for (const creador of Object.values(candidatos)) {
    const proveedor = creador();
    if (proveedor) return proveedor;
  }

  return proveedorConsola;
}

let cache: ProveedorDeEmail | null = null;

export function proveedorActual(): ProveedorDeEmail {
  cache ??= elegirProveedor();
  return cache;
}

export function hayProveedorConfigurado(): boolean {
  return proveedorActual().nombre !== "consola";
}

/**
 * ¿Está disponible el acceso por email con link (link mágico)?
 *
 * Es la única definición de esta regla: la usan `auth.ts` para registrar el
 * proveedor y la página de login para mostrar el formulario. Si estuviera
 * escrita dos veces, en algún momento una diría que sí y la otra que no, y el
 * usuario vería un formulario que no lleva a ningún lado.
 *
 * En desarrollo siempre está disponible: el proveedor "consola" imprime el
 * link en la terminal, así que se puede probar el circuito completo sin
 * configurar nada. En producción solo con un proveedor real, porque un link
 * impreso en un log no le sirve a nadie.
 */
export function hayAccesoPorEmail(): boolean {
  return hayProveedorConfigurado() || process.env.NODE_ENV !== "production";
}

/**
 * Envía un mail, o falla en silencio.
 *
 * Decisión importante: esto NUNCA lanza. Un proveedor de email caído no puede
 * tumbar la confirmación de un pago, que es la operación crítica. El error se
 * registra para poder investigarlo, y el pedido queda igual de confirmado.
 * Si los mails son parte del negocio, más adelante conviene una cola con
 * reintentos y un estado "email pendiente" en el pedido.
 */
export async function enviar(mensaje: {
  para: string;
  asunto: string;
  html: string;
  texto?: string;
}): Promise<boolean> {
  const proveedor = proveedorActual();

  try {
    await proveedor.enviar(mensaje);
    return true;
  } catch (error) {
    console.error(
      `[email] falló el envío con ${proveedor.nombre} a ${mensaje.para}:`,
      error,
    );
    return false;
  }
}
