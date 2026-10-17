import type { Metadata } from "next";

import { cambiarEstadoPedido } from "@/app/actions/admin";
import { ESTADOS_PEDIDO, ESTADOS_PENDIENTES } from "@/lib/constantes";
import { formatearFecha, formatearPrecio } from "@/lib/formato";
import { pedidosPorEstado } from "@/lib/pedidos";

export const metadata: Metadata = { title: "Pedidos pendientes" };

export default async function PaginaAdminPedidos() {
  const pedidos = await pedidosPorEstado(ESTADOS_PENDIENTES);

  return (
    <div>
      <h2 className="text-xl font-bold">Pedidos pendientes</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        {pedidos.length}{" "}
        {pedidos.length === 1 ? "pedido requiere" : "pedidos requieren"}{" "}
        atención.
      </p>

      {pedidos.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-borde p-10 text-center text-sm text-tinta-suave">
          No hay pedidos pendientes.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="rounded-xl border border-borde p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-semibold">
                    #{pedido.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-tinta-suave">
                    {pedido.user?.name ?? "Sin nombre"} · {pedido.user?.email}
                  </p>
                  <p className="text-xs text-tinta-suave">
                    {formatearFecha(pedido.createdAt)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="tabular text-lg font-extrabold">
                    {formatearPrecio(pedido.totalCents)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      pedido.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {(ESTADOS_PEDIDO as Record<string, string>)[pedido.status]}
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-1 border-t border-borde pt-4 text-sm">
                {pedido.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4">
                    <span>
                      {item.quantity}× {item.productName}{" "}
                      <span className="text-xs text-tinta-suave">
                        (Talle {item.size} · {item.color})
                      </span>
                    </span>
                    <span className="tabular text-tinta-suave">
                      {formatearPrecio(item.unitCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-1 border-t border-borde pt-4 text-sm">
                <div className="flex justify-between text-tinta-suave">
                  <span>Productos</span>
                  <span className="tabular">
                    {formatearPrecio(pedido.totalCents - pedido.shippingCents)}
                  </span>
                </div>
                <div className="flex justify-between text-tinta-suave">
                  <span>
                    Envío ({pedido.shippingMethod ?? "sin especificar"})
                  </span>
                  <span className="tabular">
                    {pedido.shippingCents === 0
                      ? "Gratis"
                      : formatearPrecio(pedido.shippingCents)}
                  </span>
                </div>
              </div>

              <form
                action={cambiarEstadoPedido}
                className="mt-4 flex flex-wrap items-end gap-3 border-t border-borde pt-4"
              >
                <input type="hidden" name="orderId" value={pedido.id} />
                <label className="text-sm">
                  <span className="block text-tinta-suave">Estado</span>
                  <select
                    name="estado"
                    defaultValue={pedido.status}
                    className="mt-1 rounded-lg border border-borde px-3 py-2 text-sm"
                  >
                    {Object.entries(ESTADOS_PEDIDO).map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="block text-tinta-suave">
                    Seguimiento (opcional)
                  </span>
                  <input
                    name="trackingCode"
                    defaultValue={pedido.trackingCode ?? ""}
                    placeholder="CA123456789AR"
                    className="mt-1 w-44 rounded-lg border border-borde px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-bold text-white hover:bg-marca-700"
                >
                  Actualizar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
