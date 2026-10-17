"use client";

import { useActionState, useMemo, useState } from "react";

import { agregarAlCarrito, type EstadoCarrito } from "@/app/actions/carrito";

type Variante = { id: string; size: string; color: string; stock: number };

type Props = {
  producto: {
    name: string;
    slug: string;
    priceCents: number;
    listCents: number | null;
    variants: Variante[];
  };
  talles: readonly string[];
};

export function SelectorProducto({ producto, talles }: Props) {
  const colores = useMemo(
    () => [...new Set(producto.variants.map((v) => v.color))],
    [producto.variants],
  );

  const [color, setColor] = useState(colores[0] ?? "");
  const [talle, setTalle] = useState<string | null>(null);
  const [estado, accion, pendiente] = useActionState<EstadoCarrito, FormData>(
    agregarAlCarrito,
    {},
  );

  /** Combinación talle+color elegida, si existe y tiene stock. */
  const variante = producto.variants.find(
    (v) => v.color === color && v.size === talle,
  );

  const tallesDeColor = (c: string) =>
    producto.variants.filter((v) => v.color === c);

  return (
    <div>
      {/* Color */}
      <div>
        <p className="text-sm font-semibold">
          Color: <span className="font-normal text-tinta-suave">{color}</span>
        </p>
        <div className="mt-2 flex gap-2">
          {colores.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                // El talle elegido puede no existir en el color nuevo.
                if (!producto.variants.some((v) => v.color === c && v.size === talle)) {
                  setTalle(null);
                }
              }}
              aria-pressed={c === color}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                c === color
                  ? "border-marca-600 bg-marca-50 font-semibold text-marca-700"
                  : "border-borde hover:border-marca-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Talle */}
      <div className="mt-5">
        <p className="text-sm font-semibold">Talle</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {talles.map((t) => {
            const v = tallesDeColor(color).find((x) => x.size === t);
            const sinStock = !v || v.stock === 0;
            return (
              <button
                key={t}
                type="button"
                disabled={sinStock}
                onClick={() => setTalle(t)}
                aria-pressed={talle === t}
                title={sinStock ? "Sin stock en este color" : undefined}
                className={`min-w-12 rounded-lg border px-3 py-2 text-sm transition ${
                  talle === t
                    ? "border-marca-600 bg-marca-600 font-semibold text-white"
                    : sinStock
                      ? "cursor-not-allowed border-borde text-tinta-suave/40 line-through"
                      : "border-borde hover:border-marca-500"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Disponibilidad */}
      <p className="mt-4 text-sm">
        {!talle ? (
          <span className="text-tinta-suave">Elegí un talle para continuar.</span>
        ) : variante && variante.stock > 0 ? (
          <span className="font-medium text-exito">
            {variante.stock === 1
              ? "¡Última unidad!"
              : `${variante.stock} unidades disponibles`}
          </span>
        ) : (
          <span className="font-medium text-oferta">
            Sin stock en esa combinación.
          </span>
        )}
      </p>

      {/* Agregar al carrito */}
      <form action={accion} className="mt-5">
        <input type="hidden" name="variantId" value={variante?.id ?? ""} />
        <input type="hidden" name="cantidad" value={1} />

        <button
          type="submit"
          disabled={!variante || variante.stock === 0 || pendiente}
          className="w-full rounded-lg bg-marca-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-marca-700 disabled:cursor-not-allowed disabled:bg-borde disabled:text-tinta-suave"
        >
          {pendiente ? "Agregando..." : "Agregar al carrito"}
        </button>
      </form>

      {estado?.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-oferta">
          {estado.error}
        </p>
      )}
      {estado?.ok && (
        <p role="status" className="mt-3 text-sm font-medium text-exito">
          ¡Listo! Lo agregamos a tu carrito.
        </p>
      )}
    </div>
  );
}
