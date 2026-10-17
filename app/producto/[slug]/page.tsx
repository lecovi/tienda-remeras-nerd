import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SelectorProducto } from "@/components/SelectorProducto";
import { stockTotal, obtenerProductoPorSlug } from "@/lib/catalogo";
import { TALLES } from "@/lib/constantes";
import { formatearPrecio, porcentajeDescuento } from "@/lib/formato";

type Props = PageProps<"/producto/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const producto = await obtenerProductoPorSlug(slug);
  if (!producto) return { title: "Producto no encontrado" };

  return {
    title: `${producto.name} - Remera Unisex`,
    description: producto.description,
  };
}

export default async function PaginaProducto({ params }: Props) {
  const { slug } = await params;
  const producto = await obtenerProductoPorSlug(slug);

  if (!producto || !producto.isActive) notFound();

  const descuento = porcentajeDescuento(producto.priceCents, producto.listCents);
  const agotado = stockTotal(producto.variants) === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-tinta-suave">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>{" "}
        ·{" "}
        <Link href="/catalogo" className="hover:underline">
          Productos
        </Link>{" "}
        ·{" "}
        <Link
          href={`/catalogo?categoria=${encodeURIComponent(producto.category)}`}
          className="hover:underline"
        >
          {producto.category}
        </Link>{" "}
        · {producto.name}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Imagen */}
        <div className="relative overflow-hidden rounded-2xl border border-borde bg-humo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={producto.imageUrl}
            alt={producto.name}
            width={480}
            height={480}
            className="aspect-square w-full object-cover"
          />
          {descuento !== null && (
            <span className="absolute left-4 top-4 rounded bg-oferta px-2.5 py-1.5 text-xs font-bold text-white">
              -{descuento}% OFF
            </span>
          )}
        </div>

        {/* Ficha */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-marca-600">
            {producto.category}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {producto.name} - Remera Unisex
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="tabular text-3xl font-extrabold">
              {formatearPrecio(producto.priceCents)}
            </span>
            {producto.listCents && (
              <span className="tabular text-base text-tinta-suave line-through">
                {formatearPrecio(producto.listCents)}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {producto.freeShipping && !agotado && (
              <span className="rounded bg-acento px-2.5 py-1 text-xs font-bold text-tinta">
                Envío gratis
              </span>
            )}
            {agotado && (
              <span className="rounded bg-tinta px-2.5 py-1 text-xs font-bold text-white">
                Agotado
              </span>
            )}
          </div>

          <div className="mt-6 border-t border-borde pt-6">
            <SelectorProducto producto={producto} talles={TALLES} />
          </div>

          <div className="mt-8 space-y-3 border-t border-borde pt-6 text-sm text-tinta-suave">
            <p>{producto.description}</p>
            <ul className="list-inside list-disc space-y-1">
              <li>100% algodón peinado, calce recto unisex</li>
              <li>Estampa por sublimación, no se cuartea ni se despega</li>
              <li>Envío a todo el país en 3 a 7 días hábiles</li>
              <li>Cambio sin cargo dentro de los 30 días</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Datos estructurados, igual que la referencia */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: `${producto.name} - Remera Unisex`,
            image: producto.imageUrl,
            description: producto.description,
            category: producto.category,
            offers: {
              "@type": "Offer",
              priceCurrency: "ARS",
              price: (producto.priceCents / 100).toFixed(2),
              availability: agotado
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            },
          }),
        }}
      />
    </div>
  );
}
