"use server";

import { revalidatePath } from "next/cache";

import {
  actualizarCantidad as actualizarCantidadEnBase,
  agregarAlCarrito as agregarEnBase,
  quitarDelCarrito as quitarEnBase,
} from "@/lib/carrito";
import {
  duenoDelCarrito,
  duenoDelCarritoParaEscribir,
} from "@/lib/sesion";

export type EstadoCarrito = { error?: string; ok?: boolean };

/**
 * El contador del carrito vive en el header, que está en el layout: sin
 * revalidar el layout, el número quedaría viejo hasta la próxima navegación.
 */
function revalidar() {
  revalidatePath("/carrito");
  revalidatePath("/", "layout");
}

/**
 * Agrega una variante al carrito.
 *
 * No exige sesión: un visitante puede armar el carrito y recién se le pide
 * registrarse al pagar. Si es invitado, se le crea la cookie que identifica su
 * carrito.
 */
export async function agregarAlCarrito(
  _estado: EstadoCarrito,
  formData: FormData,
): Promise<EstadoCarrito> {
  const variantId = formData.get("variantId");
  const cantidad = Number(formData.get("cantidad") ?? 1);

  if (typeof variantId !== "string" || !variantId) {
    return { error: "Variante inválida." };
  }
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return { error: "Cantidad inválida." };
  }

  const dueno = await duenoDelCarritoParaEscribir();
  const resultado = await agregarEnBase(dueno, variantId, cantidad);

  if (!resultado.ok) return { error: resultado.error };

  revalidar();
  return { ok: true };
}

export async function actualizarCantidad(formData: FormData): Promise<void> {
  const itemId = formData.get("itemId");
  const cantidad = Number(formData.get("cantidad"));

  if (typeof itemId !== "string" || !itemId) return;

  // Acá se lee y no se escribe cookie: si no hay carrito, no hay nada que
  // actualizar, y crear una cookie al vacío sería basura.
  const dueno = await duenoDelCarrito();
  if (!dueno) return;

  await actualizarCantidadEnBase(dueno, itemId, cantidad);
  revalidar();
}

export async function quitarDelCarrito(formData: FormData): Promise<void> {
  const itemId = formData.get("itemId");

  if (typeof itemId !== "string" || !itemId) return;

  const dueno = await duenoDelCarrito();
  if (!dueno) return;

  await quitarEnBase(dueno, itemId);
  revalidar();
}
