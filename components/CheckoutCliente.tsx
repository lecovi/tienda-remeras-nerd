"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { iniciarPago, type EstadoCheckout } from "@/app/actions/checkout";
import type { OpcionDeEnvio } from "@/lib/envio-tipos";
import { formatearPrecio } from "@/lib/formato";

export type ItemCheckout = {
  id: string;
  nombre: string;
  talle: string;
  color: string;
  cantidad: number;
  unitCents: number;
};

type Props = {
  items: ItemCheckout[];
  opciones: OpcionDeEnvio[];
  configurado: boolean;
  medioGuardado: { brand: string; last4: string } | null;
  comprador: { name: string | null; email: string | null };
};

/**
 * Todo el checkout vive en un único formulario.
 *
 * Es a propósito: la opción de envío elegida tiene que viajar junto con el
 * pago, y el total que se ve tiene que ser exactamente el que se cobra. Si
 * fueran dos formularios separados, el resumen y el pedido podrían discrepar.
 */
export function CheckoutCliente({
  items,
  opciones,
  configurado,
  medioGuardado,
  comprador,
}: Props) {
  const [envioId, setEnvioId] = useState(opciones[0]?.id ?? "domicilio");
  const [estado, accion, pendiente] = useActionState<EstadoCheckout, FormData>(
    iniciarPago,
    {},
  );

  const subtotal = items.reduce(
    (acc, i) => acc + i.unitCents * i.cantidad,
    0,
  );
  const envio = opciones.find((o) => o.id === envioId) ?? opciones[0];
  const total = subtotal + (envio?.costoCentavos ?? 0);

  return (
    <form action={accion} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Datos del comprador */}
        <section className="rounded-xl border border-borde p-5">
          <h2 className="font-bold">Tus datos</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-tinta-suave">Nombre:</dt>
              <dd className="font-medium">{comprador.name ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-tinta-suave">Email:</dt>
              <dd className="font-medium">{comprador.email}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-tinta-suave">
            Te enviamos la confirmación de compra a ese email.
          </p>
        </section>

        {/* Envío */}
        <section className="rounded-xl border border-borde p-5">
          <h2 className="font-bold">Envío</h2>
          <div className="mt-3 space-y-2">
            {opciones.map((o) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition ${
                  envioId === o.id
                    ? "border-marca-500 bg-marca-50"
                    : "border-borde hover:border-marca-500"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="envio"
                    value={o.id}
                    checked={envioId === o.id}
                    onChange={() => setEnvioId(o.id)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {o.nombre}
                    </span>
                    <span className="block text-xs text-tinta-suave">
                      {o.detalle} · {o.plazo}
                    </span>
                  </span>
                </span>
                <span className="tabular whitespace-nowrap text-sm font-bold">
                  {o.costoCentavos === 0 ? (
                    <span className="text-exito">Gratis</span>
                  ) : (
                    formatearPrecio(o.costoCentavos)
                  )}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Pago */}
        <section className="rounded-xl border border-borde p-5">
          <h2 className="font-bold">Medio de pago</h2>

          <div className="mt-3 rounded-lg border border-marca-500 bg-marca-50 p-4">
            <p className="text-sm font-semibold">
              MercadoPago (tarjeta, transferencia o efectivo)
            </p>
            <p className="mt-1 text-xs text-tinta-suave">
              Te redirigimos a MercadoPago para completar el pago de forma
              segura. No vemos ni guardamos los datos de tu tarjeta.
            </p>
          </div>

          {medioGuardado && (
            <p className="mt-3 text-xs text-tinta-suave">
              Tenés guardada una tarjeta {medioGuardado.brand} terminada en{" "}
              {medioGuardado.last4}.{" "}
              <Link
                href="/cuenta/medios-de-pago"
                className="underline hover:text-tinta"
              >
                Administrar medios de pago
              </Link>
            </p>
          )}

          {!configurado && (
            <p className="mt-4 rounded-lg bg-humo px-3 py-2 text-xs text-tinta-suave">
              Para habilitar el cobro real, cargá{" "}
              <code className="font-mono">MERCADOPAGO_ACCESS_TOKEN</code> y{" "}
              <code className="font-mono">MERCADOPAGO_WEBHOOK_SECRET</code> en el{" "}
              <code className="font-mono">.env</code>. Se obtienen en{" "}
              <span className="underline">mercadopago.com.ar/developers/panel</span>{" "}
              usando las credenciales de prueba.
            </p>
          )}
        </section>

        {estado?.error && (
          <p
            role="alert"
            className="rounded-lg bg-oferta/10 px-4 py-3 text-sm font-medium text-oferta"
          >
            {estado.error}
          </p>
        )}
      </div>

      {/* Resumen */}
      <aside className="h-fit rounded-xl border border-borde bg-humo p-5">
        <h2 className="font-bold">Tu pedido</h2>

        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="text-tinta-suave">
                {i.cantidad}× {i.nombre}
                <span className="block text-xs">
                  Talle {i.talle} · {i.color}
                </span>
              </span>
              <span className="tabular whitespace-nowrap font-medium">
                {formatearPrecio(i.unitCents * i.cantidad)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-borde pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-tinta-suave">Subtotal</dt>
            <dd className="tabular font-medium">{formatearPrecio(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinta-suave">Envío</dt>
            <dd className="tabular font-medium">
              {envio && envio.costoCentavos > 0 ? (
                formatearPrecio(envio.costoCentavos)
              ) : (
                <span className="text-exito">Gratis</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex justify-between border-t border-borde pt-4">
          <span className="font-bold">Total</span>
          <span className="tabular text-lg font-extrabold">
            {formatearPrecio(total)}
          </span>
        </div>

        <button
          type="submit"
          disabled={pendiente || !configurado}
          className="mt-5 w-full rounded-lg bg-marca-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-marca-700 disabled:cursor-not-allowed disabled:bg-borde disabled:text-tinta-suave"
        >
          {pendiente ? "Redirigiendo a MercadoPago..." : "Pagar con MercadoPago"}
        </button>

        <Link
          href="/carrito"
          className="mt-4 block text-center text-xs text-tinta-suave hover:text-tinta"
        >
          Volver al carrito
        </Link>
      </aside>
    </form>
  );
}
