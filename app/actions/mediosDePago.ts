"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { marcarPredeterminado } from "@/lib/mediosDePago";
import { prisma } from "@/lib/prisma";
import { requerirUsuario } from "@/lib/sesion";

export type EstadoMedioPago = { error?: string; ok?: boolean; errores?: Record<string, string[]> };

const anioActual = new Date().getFullYear();

/**
 * Validación del alta de una tarjeta.
 *
 * Solo se aceptan marca, últimos 4 dígitos, vencimiento y titular. El número
 * completo y el CVV NUNCA se reciben ni se guardan: una app que no es PCI-DSS
 * no puede almacenarlos. En producción, el número se tokeniza contra la
 * pasarela y acá se guardaría el token.
 */
const esquemaTarjeta = z.object({
  brand: z.enum(["Visa", "Mastercard", "Amex"], "Elegí una marca válida."),
  last4: z.string().regex(/^\d{4}$/, "Ingresá los últimos 4 dígitos."),
  expMonth: z.coerce
    .number("Mes inválido.")
    .int("Mes inválido.")
    .min(1, "Mes entre 1 y 12.")
    .max(12, "Mes entre 1 y 12."),
  expYear: z.coerce
    .number("Año inválido.")
    .int("Año inválido.")
    .min(anioActual, `El año no puede ser anterior a ${anioActual}.`)
    .max(anioActual + 20, "Año fuera de rango."),
  holder: z
    .string()
    .trim()
    .min(3, "Escribí el nombre como figura en la tarjeta.")
    .max(60, "Máximo 60 caracteres."),
});

export async function agregarMedio(
  _estado: EstadoMedioPago,
  formData: FormData,
): Promise<EstadoMedioPago> {
  const usuario = await requerirUsuario();

  const resultado = esquemaTarjeta.safeParse({
    brand: formData.get("brand"),
    last4: formData.get("last4"),
    expMonth: formData.get("expMonth"),
    expYear: formData.get("expYear"),
    holder: formData.get("holder"),
  });

  if (!resultado.success) {
    return { errores: resultado.error.flatten().fieldErrors };
  }

  const esElPrimero =
    (await prisma.paymentMethod.count({ where: { userId: usuario.id } })) === 0;

  await prisma.paymentMethod.create({
    data: {
      userId: usuario.id,
      ...resultado.data,
      // La primera tarjeta queda como predeterminada sin preguntar.
      isDefault: esElPrimero,
    },
  });

  revalidatePath("/cuenta/medios-de-pago");
  return { ok: true };
}

export async function quitarMedio(formData: FormData): Promise<void> {
  const usuario = await requerirUsuario();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  // deleteMany con userId: evita que alguien borre el medio de otra persona.
  await prisma.paymentMethod.deleteMany({ where: { id, userId: usuario.id } });

  revalidatePath("/cuenta/medios-de-pago");
}

export async function predeterminarMedio(formData: FormData): Promise<void> {
  const usuario = await requerirUsuario();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  // Si el id no es del usuario, marcarPredeterminado lanza y no se cambia nada.
  await marcarPredeterminado(usuario.id, id);

  revalidatePath("/cuenta/medios-de-pago");
}
