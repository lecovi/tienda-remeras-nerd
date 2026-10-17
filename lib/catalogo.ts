import "server-only";

import { prisma } from "@/lib/prisma";
import type { Orden } from "@/lib/constantes";

export type FiltrosCatalogo = {
  categoria?: string;
  talle?: string;
  color?: string;
  orden?: Orden;
  busqueda?: string;
};

/**
 * Traduce el orden pedido a la cláusula de Prisma.
 *
 * Nota: la referencia tiene "Más vendidos", pero acá no se implementó porque
 * exigiría agregar ventas sobre las variantes y hoy daría un resultado falso.
 * Los órdenes listados son todos reales sobre los datos existentes.
 */
function ordenParaPrisma(orden: Orden | undefined) {
  switch (orden) {
    case "precio-asc":
      return { priceCents: "asc" as const };
    case "precio-desc":
      return { priceCents: "desc" as const };
    case "nombre-desc":
      return { name: "desc" as const };
    case "antiguos":
      return { createdAt: "asc" as const };
    case "nombre-asc":
      return { name: "asc" as const };
    case "recientes":
    default:
      return { createdAt: "desc" as const };
  }
}

export async function listarProductos(filtros: FiltrosCatalogo = {}) {
  const { categoria, talle, color, orden, busqueda } = filtros;

  // Los filtros de talle y color se resuelven sobre las variantes: alcanza con
  // que exista una variante que cumpla, no hace falta que coincidan todas.
  const condicionesVariante: { size?: string; color?: string } = {};
  if (talle) condicionesVariante.size = talle;
  if (color) condicionesVariante.color = color;

  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(categoria ? { category: categoria } : {}),
      ...(busqueda ? { name: { contains: busqueda } } : {}),
      ...(Object.keys(condicionesVariante).length
        ? { variants: { some: condicionesVariante } }
        : {}),
    },
    include: {
      variants: {
        select: { id: true, size: true, color: true, stock: true },
      },
    },
    orderBy: ordenParaPrisma(orden),
  });
}

export async function obtenerProductoPorSlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
    },
  });
}

/** Cantidad de productos activos por categoría, para el menú lateral. */
export async function conteoPorCategoria(): Promise<Record<string, number>> {
  const filas = await prisma.product.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { _all: true },
  });

  return Object.fromEntries(filas.map((f) => [f.category, f._count._all]));
}

/** Stock total de un producto (suma de sus variantes). */
export function stockTotal(variants: { stock: number }[]): number {
  return variants.reduce((acc, v) => acc + v.stock, 0);
}
