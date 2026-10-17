import type { Metadata } from "next";

import { Filtros } from "@/components/Filtros";
import { OrdenSelect } from "@/components/OrdenSelect";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIAS, COLORES, TALLES, type Orden } from "@/lib/constantes";
import { conteoPorCategoria, listarProductos } from "@/lib/catalogo";

export const metadata: Metadata = {
  title: "Remeras",
  description:
    "Toda la colección de remeras nerd: videojuegos, cómics, animé, cine y retro. Envíos a todo el país y 6 cuotas sin interés.",
};

type Parametros = { [clave: string]: string | string[] | undefined };

/** Toma el primer valor: los parámetros de búsqueda pueden venir repetidos. */
function uno(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor ?? undefined;
}

/**
 * Arma una URL del catálogo aplicando cambios sobre los filtros actuales.
 * Un cambio con valor `undefined` borra ese filtro.
 */
function urlCon(
  actual: Record<string, string | undefined>,
  cambios: Record<string, string | undefined>,
): string {
  const mezcla = { ...actual, ...cambios };
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(mezcla)) {
    if (valor) params.set(clave, valor);
  }
  const query = params.toString();
  return query ? `/catalogo?${query}` : "/catalogo";
}

export default async function PaginaCatalogo({
  searchParams,
}: PageProps<"/catalogo">) {
  const params = (await searchParams) as Parametros;

  const categoria = uno(params.categoria);
  const talle = uno(params.talle);
  const color = uno(params.color);
  const orden = uno(params.orden) as Orden | undefined;
  const busqueda = uno(params.q);

  const [productos, conteos] = await Promise.all([
    listarProductos({ categoria, talle, color, orden, busqueda }),
    conteoPorCategoria(),
  ]);

  const actual = { categoria, talle, color, q: busqueda, orden };

  // Categorías presentes en el catálogo, en el orden canónico.
  const categoriasVisibles = CATEGORIAS.filter((c) => (conteos[c] ?? 0) > 0);

  const enlaces = {
    categorias: categoriasVisibles.map((c) => ({
      valor: c,
      url: urlCon(actual, { categoria: categoria === c ? undefined : c }),
      activo: categoria === c,
    })),
    talles: TALLES.map((t) => ({
      valor: t,
      url: urlCon(actual, { talle: talle === t ? undefined : t }),
      activo: talle === t,
    })),
    colores: COLORES.map((c) => ({
      valor: c,
      url: urlCon(actual, { color: color === c ? undefined : c }),
      activo: color === c,
    })),
    limpiar: "/catalogo",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-4 text-xs text-tinta-suave">
        Inicio · Productos{categoria ? ` · ${categoria}` : ""}
      </nav>

      <h1 className="text-3xl font-extrabold tracking-tight">
        {categoria ?? "Remeras"}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-tinta-suave">
        Remeras de cultura pop pensadas para quienes crecieron rodeados de
        referencias que siguen vigentes. Algodón de calidad, estampas duraderas
        y calce cómodo unisex.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <Filtros conteos={conteos} actual={actual} enlaces={enlaces} />

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-borde pb-4">
            <p className="text-sm text-tinta-suave">
              {productos.length}{" "}
              {productos.length === 1 ? "producto" : "productos"}
              {busqueda ? ` para “${busqueda}”` : ""}
            </p>
            <OrdenSelect />
          </div>

          {productos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-borde p-12 text-center">
              <p className="font-semibold">No encontramos productos</p>
              <p className="mt-2 text-sm text-tinta-suave">
                Probá quitando algún filtro o mirando otra categoría.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {productos.map((p) => (
                <ProductCard key={p.id} producto={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
