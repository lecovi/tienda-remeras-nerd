import type { Metadata } from "next";

import { FormularioTarjeta } from "@/components/FormularioTarjeta";
import { predeterminarMedio, quitarMedio } from "@/app/actions/mediosDePago";
import { metodosDePago } from "@/lib/mediosDePago";
import { requerirUsuario } from "@/lib/sesion";

export const metadata: Metadata = { title: "Medios de pago" };

export default async function PaginaMediosDePago() {
  const usuario = await requerirUsuario();
  const medios = await metodosDePago(usuario.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div>
        <h2 className="font-bold">Tarjetas guardadas</h2>

        {medios.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-borde p-8 text-center text-sm text-tinta-suave">
            Todavía no guardaste ninguna tarjeta.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-borde rounded-xl border border-borde">
            {medios.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {m.brand} •••• {m.last4}
                    {m.isDefault && (
                      <span className="ml-2 rounded bg-marca-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-marca-700">
                        Predeterminada
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-tinta-suave">
                    {m.holder} · vence {String(m.expMonth).padStart(2, "0")}/
                    {m.expYear}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {!m.isDefault && (
                    <form action={predeterminarMedio}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="font-medium text-marca-600 hover:underline"
                      >
                        Usar como predeterminada
                      </button>
                    </form>
                  )}
                  <form action={quitarMedio}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="text-tinta-suave underline hover:text-oferta"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 rounded-xl bg-humo p-4 text-xs text-tinta-suave">
          <p className="font-semibold text-tinta">
            Cómo funciona el pago realmente
          </p>
          <p className="mt-2">
            Al pagar se te redirige a MercadoPago, que procesa la tarjeta. Esta
            lista es tu agenda de tarjetas para elegir más rápido: no se cobra
            desde acá ni se guardan datos sensibles.
          </p>
        </div>
      </div>

      <FormularioTarjeta />
    </div>
  );
}
