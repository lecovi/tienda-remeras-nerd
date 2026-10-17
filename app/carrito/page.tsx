import type { Metadata } from "next";
import Link from "next/link";

import { BotonCantidad } from "@/components/BotonCantidad";
import { actualizarCantidad, quitarDelCarrito } from "@/app/actions/carrito";
import { itemsDelCarrito, totalCarrito, unidadesCarrito } from "@/lib/carrito";
import { UMBRAL_ENVIO_GRATIS_CENTS } from "@/lib/constantes";
import { formatearPrecio, resumenCuotas } from "@/lib/formato";
import { duenoDelCarrito, usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Tu carrito" };

export default async function PaginaCarrito() {
  // El carrito se puede armar sin cuenta: recién se pide entrar al pagar.
  const [dueno, usuario] = await Promise.all([
    duenoDelCarrito(),
    usuarioActual(),
  ]);
  const items = await itemsDelCarrito(dueno);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Tu carrito está vacío
        </h1>
        <p className="mt-3 text-sm text-tinta-suave">
          Todavía no agregaste ninguna remera. Mirá el catálogo y elegí la tuya.
        </p>
        <Link
          href="/catalogo"
          className="mt-8 inline-block rounded-lg bg-marca-600 px-6 py-3 text-sm font-bold text-white hover:bg-marca-700"
        >
          Ver el catálogo
        </Link>
      </div>
    );
  }

  const total = totalCarrito(items);
  const unidades = unidadesCarrito(items);
  const faltaParaEnvioGratis = UMBRAL_ENVIO_GRATIS_CENTS - total;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Tu carrito</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        {unidades} {unidades === 1 ? "unidad" : "unidades"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Ítems */}
        <ul className="divide-y divide-borde border-y border-borde">
          {items.map((item) => {
            const { variant } = item;
            const subtotal = variant.product.priceCents * item.quantity;

            return (
              <li key={item.id} className="flex gap-4 py-5">
                <Link
                  href={`/producto/${variant.product.slug}`}
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={variant.product.imageUrl}
                    alt={variant.product.name}
                    width={112}
                    height={112}
                    className="h-28 w-28 rounded-lg border border-borde bg-humo object-cover"
                  />
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/producto/${variant.product.slug}`}
                        className="text-sm font-semibold hover:text-marca-600"
                      >
                        {variant.product.name}
                      </Link>
                      <p className="mt-1 text-xs text-tinta-suave">
                        Talle {variant.size} · {variant.color}
                      </p>
                      <p className="tabular mt-1 text-xs text-tinta-suave">
                        {formatearPrecio(variant.product.priceCents)} c/u
                      </p>
                    </div>

                    <form action={quitarDelCarrito}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className="text-xs text-tinta-suave underline hover:text-oferta"
                      >
                        Quitar
                      </button>
                    </form>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-3">
                    <BotonCantidad
                      itemId={item.id}
                      cantidad={item.quantity}
                      stock={variant.stock}
                      accion={actualizarCantidad}
                    />
                    <span className="tabular text-sm font-bold">
                      {formatearPrecio(subtotal)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Resumen */}
        <aside className="h-fit rounded-xl border border-borde bg-humo p-5">
          <h2 className="text-lg font-bold">Resumen</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-tinta-suave">Subtotal</dt>
              <dd className="tabular font-medium">{formatearPrecio(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-tinta-suave">Envío</dt>
              <dd className="font-medium">
                {faltaParaEnvioGratis <= 0 ? (
                  <span className="text-exito">Gratis</span>
                ) : (
                  "Se calcula en el checkout"
                )}
              </dd>
            </div>
          </dl>

          {faltaParaEnvioGratis > 0 && (
            <p className="mt-4 rounded-lg bg-acento/30 px-3 py-2 text-xs font-medium text-acento-oscuro">
              Te faltan {formatearPrecio(faltaParaEnvioGratis)} para tener envío
              gratis.
            </p>
          )}

          <div className="mt-4 flex justify-between border-t border-borde pt-4">
            <span className="font-bold">Total</span>
            <span className="tabular text-lg font-extrabold">
              {formatearPrecio(total)}
            </span>
          </div>

          <p className="mt-1 text-xs text-tinta-suave">
            O {resumenCuotas(total)}
          </p>

          {usuario ? (
            <Link
              href="/checkout"
              className="mt-5 block rounded-lg bg-marca-600 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-marca-700"
            >
              Iniciar compra
            </Link>
          ) : (
            <>
              <Link
                href="/login?destino=/checkout"
                className="mt-5 block rounded-lg bg-marca-600 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-marca-700"
              >
                Entrar y comprar
              </Link>
              <p className="mt-3 text-center text-xs text-tinta-suave">
                Tu carrito queda guardado. Podés entrar con Google, GitHub o tu
                email.
              </p>
            </>
          )}

          <Link
            href="/catalogo"
            className="mt-3 block text-center text-sm text-tinta-suave hover:text-tinta"
          >
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
