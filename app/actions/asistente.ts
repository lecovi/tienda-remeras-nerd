"use server";

import { proveedorAsistente } from "@/lib/asistente";
import type { Propuesta } from "@/lib/asistente/tipos";
import { requerirAdmin } from "@/lib/sesion";

export type ResultadoAsistente =
  | ({ ok: true } & Propuesta)
  | { ok: false; error: string };

const LARGO_MAXIMO = 600;

/**
 * Genera (o ajusta) un estampado a pedido del backoffice.
 *
 * Es una Server Action, así que es un endpoint público de hecho: cualquiera
 * puede postearle. `requerirAdmin()` es lo que la cierra, igual que en el resto
 * del backoffice. Y como cada llamada cuesta plata, el largo del pedido se
 * valida acá y no solo en el formulario.
 */
export async function pedirDiseno(
  pedido: string,
  imagenPrevia?: string,
): Promise<ResultadoAsistente> {
  await requerirAdmin();

  const limpio = pedido.trim();

  if (limpio.length < 4) {
    return { ok: false, error: "Describí un poco más lo que querés en la remera." };
  }
  if (limpio.length > LARGO_MAXIMO) {
    return {
      ok: false,
      error: `El pedido no puede pasar de ${LARGO_MAXIMO} caracteres.`,
    };
  }

  const proveedor = proveedorAsistente();
  if (!proveedor) {
    return {
      ok: false,
      error: "El asistente no está configurado en este servidor.",
    };
  }

  try {
    const propuesta = await proveedor.generar({ pedido: limpio, imagenPrevia });
    return { ok: true, ...propuesta };
  } catch (error) {
    console.error("[asistente] falló la generación:", error);
    return {
      ok: false,
      error: "No pudimos generar el diseño. Probá de nuevo en un momento.",
    };
  }
}
