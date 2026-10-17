import Link from "next/link";

import { formatearPrecio, porcentajeDescuento, resumenCuotas } from "@/lib/formato";
import { stockTotal } from "@/lib/catalogo";

type Producto = {
  slug: string;
  name: string;
  imageUrl: string;
  priceCents: number;
  listCents: number | null;
  freeShipping: boolean;
  variants: { stock: number }[];
};

export function ProductCard({ producto }: { producto: Producto }) {
  const descuento = porcentajeDescuento(producto.priceCents, producto.listCents);
  const agotado = stockTotal(producto.variants) === 0;

  return (
    <article className="group flex flex-col">
      <Link
        href={`/producto/${producto.slug}`}
        className="relative block overflow-hidden rounded-xl border border-borde bg-humo"
      >
        {/* img y no next/image: las imágenes del catálogo son SVG locales y el
            optimizador de Next requiere dangerouslyAllowSVG, un flag que
            preferimos no habilitar. Al pasar a fotos reales, migrar a <Image>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={producto.imageUrl}
          alt={producto.name}
          width={480}
          height={480}
          className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {descuento !== null && (
            <span className="rounded bg-oferta px-2 py-1 text-xs font-bold text-white">
              -{descuento}% OFF
            </span>
          )}
          {producto.freeShipping && !agotado && (
            <span className="rounded bg-acento px-2 py-1 text-xs font-bold text-tinta">
              Envío gratis
            </span>
          )}
          {agotado && (
            <span className="rounded bg-tinta px-2 py-1 text-xs font-bold text-white">
              Agotado
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="text-sm font-medium leading-snug">
          <Link href={`/producto/${producto.slug}`} className="hover:text-marca-600">
            {producto.name} - Remera Unisex
          </Link>
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="tabular text-base font-bold">
            {formatearPrecio(producto.priceCents)}
          </span>
          {producto.listCents && (
            <span className="tabular text-xs text-tinta-suave line-through">
              {formatearPrecio(producto.listCents)}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-tinta-suave">
          {resumenCuotas(producto.priceCents)}
        </p>
      </div>
    </article>
  );
}
