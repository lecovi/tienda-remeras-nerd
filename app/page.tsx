import Link from "next/link";

import { ProductCard } from "@/components/ProductCard";
import { CATEGORIAS } from "@/lib/constantes";
import { conteoPorCategoria, listarProductos } from "@/lib/catalogo";

export default async function PaginaInicio() {
  const [destacados, conteos] = await Promise.all([
    listarProductos({ orden: "recientes" }),
    conteoPorCategoria(),
  ]);

  const categoriasVisibles = CATEGORIAS.filter((c) => (conteos[c] ?? 0) > 0);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-borde bg-tinta text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-block rounded-full bg-acento px-3 py-1 text-xs font-bold uppercase tracking-wide text-tinta">
              Nueva colección
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
              Vestí las referencias
              <br />
              que te criaron
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
              Videogames, cómics, animé y retro. Estampas duraderas sobre
              algodón de calidad, con calce unisex y envíos a todo el país.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="rounded-lg bg-acento px-6 py-3 text-sm font-bold text-tinta transition hover:brightness-95"
              >
                Ver todas las remeras
              </Link>
              <Link
                href="/catalogo?categoria=Videogames"
                className="rounded-lg border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Ir a Videogames
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {destacados.slice(0, 2).map((p) => (
              <Link
                key={p.id}
                href={`/producto/${p.slug}`}
                className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  width={480}
                  height={480}
                  className="aspect-square w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-semibold">{p.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-b border-borde bg-humo">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
          {[
            { icono: "🚚", titulo: "Envío gratis", detalle: "En compras desde $75.000" },
            { icono: "💳", titulo: "6 cuotas sin interés", detalle: "Con todas las tarjetas" },
            { icono: "🏷️", titulo: "10% OFF", detalle: "Pagando por transferencia" },
          ].map((b) => (
            <div key={b.titulo} className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {b.icono}
              </span>
              <div>
                <p className="text-sm font-bold">{b.titulo}</p>
                <p className="text-xs text-tinta-suave">{b.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Explorá por colección
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {categoriasVisibles.map((c) => (
            <Link
              key={c}
              href={`/catalogo?categoria=${encodeURIComponent(c)}`}
              className="rounded-full border border-borde px-4 py-2 text-sm font-medium transition hover:border-marca-500 hover:text-marca-600"
            >
              {c}{" "}
              <span className="text-xs text-tinta-suave">({conteos[c]})</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Lo más nuevo
          </h2>
          <Link
            href="/catalogo"
            className="text-sm font-semibold text-marca-600 hover:underline"
          >
            Ver todo
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {destacados.slice(0, 8).map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
