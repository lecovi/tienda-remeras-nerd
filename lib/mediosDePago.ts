import "server-only";

import { prisma } from "@/lib/prisma";

export async function metodosDePago(userId: string) {
  return prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function metodoPorDefecto(userId: string) {
  return prisma.paymentMethod.findFirst({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Marca un medio como predeterminado y desmarca el resto.
 *
 * Va en una transacción porque el "hay uno y solo uno predeterminado" es un
 * invariante: si se hiciera en dos pasos sueltos, un fallo en el medio dejaría
 * al usuario sin ninguno o con dos.
 */
export async function marcarPredeterminado(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const propio = await tx.paymentMethod.findFirst({ where: { id, userId } });
    if (!propio) throw new Error("Ese medio de pago no existe.");

    await tx.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return tx.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });
  });
}
