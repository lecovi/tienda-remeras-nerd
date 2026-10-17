import "server-only";

import { crearProveedorGoogle } from "@/lib/asistente/google";
import type { ProveedorAsistente } from "@/lib/asistente/tipos";

export type { Propuesta } from "@/lib/asistente/tipos";

/**
 * Elige el proveedor del asistente.
 *
 * ASISTENTE_PROVEEDOR fuerza uno (hoy solo "google"). Si no está definido se
 * autodetecta por la credencial presente. A diferencia del email, acá no hay
 * proveedor de consola: generar una imagen es una llamada paga y no tiene
 * sentido simularla. Si no hay ninguna credencial, no hay asistente y el
 * diálogo del backoffice aparece deshabilitado con la explicación.
 */
function elegirProveedor(): ProveedorAsistente | null {
  const candidatos: Record<string, () => ProveedorAsistente | null> = {
    google: crearProveedorGoogle,
  };

  const forzado = process.env.ASISTENTE_PROVEEDOR?.toLowerCase();

  if (forzado) {
    const creador = candidatos[forzado];
    if (!creador) {
      console.warn(
        `[asistente] ASISTENTE_PROVEEDOR="${forzado}" no es válido. Opciones: google.`,
      );
      return null;
    }
    return creador();
  }

  for (const creador of Object.values(candidatos)) {
    const proveedor = creador();
    if (proveedor) return proveedor;
  }

  return null;
}

// undefined = todavía no se calculó; null = no hay ninguno. Hay que distinguirlos
// porque el resultado se cachea y "no hay" es un resultado válido.
let cache: ProveedorAsistente | null | undefined;

export function proveedorAsistente(): ProveedorAsistente | null {
  if (cache === undefined) cache = elegirProveedor();
  return cache;
}

/** ¿Está configurado el asistente? Lo usa el backoffice para habilitar el diálogo. */
export function hayAsistente(): boolean {
  return proveedorAsistente() !== null;
}
