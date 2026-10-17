import type { Metadata } from "next";
import Link from "next/link";

import { ESTADOS_PEDIDO, type EstadoPedido } from "@/lib/constantes";
import { formatearPrecio } from "@/lib/formato";
import { pedidosDelUsuario } from "@/lib/pedidos";
import { requerirUsuario } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mis pedidos" };

const COLOR_ESTADO: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-sky-100 text-sky-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

export default async function PaginaPedidos() {
  const usuario = await requerirUsuario();
  const pedidos = await pedidosDelUsuario(usuario.id);

  if (pedidos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-borde p-12 text-center">
        <p className="font-semibold">Todavía no hiciste pedidos</p>
        <p className="mt-2 text-sm text-tinta-suave">
          Cuando compres, vas a poder seguir el estado desde acá.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-block rounded-lg bg-marca-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-marca-700"
        >
          Ver el catálogo
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {pedidos.map((pedido) => {
        const estado = (ESTADOS_PEDIDO as Record<string, string>)[pedido.status]
          ?? pedido.status;

        return (
          <li
            key={pedido.id}
            className="rounded-xl border border-borde p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-tinta-suave">
                  Pedido #{pedido.id.slice(-8).toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-tinta-suave">
                  {new Intl.DateTimeFormat("es-AR", {
                    dateStyle: "long",
                  }).format(pedido.createdAt)}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  COLOR_ESTADO[pedido.status] ?? "bg-humo"
                }`}
              >
                {estado}
              </span>
            </div>

            <ul className="mt-4 space-y-1 border-t border-borde pt-4 text-sm">
              {pedido.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span className="text-tinta-suave">
                    {item.quantity}× {item.productName}{" "}
                    <span className="text-xs">
                      (Talle {item.size} · {item.color})
                    </span>
                  </span>
                  <span className="tabular whitespace-nowrap">
                    {formatearPrecio(item.unitCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex justify-between border-t border-borde pt-4">
              <span className="text-sm font-bold">Total</span>
              <span className="tabular font-extrabold">
                {formatearPrecio(pedido.totalCents)}
              </span>
            </div>

            {(pedido.status as EstadoPedido) === "PENDING" && (
              <p className="mt-3 text-xs text-tinta-suave">
                El pedido queda pendiente hasta que MercadoPago confirme el pago.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
