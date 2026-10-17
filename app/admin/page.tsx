import type { Metadata } from "next";
import Link from "next/link";

import { ESTADOS_PENDIENTES } from "@/lib/constantes";
import { formatearFecha, formatearPrecio } from "@/lib/formato";
import { pedidosPorEstado } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Resumen" };

function Tarjeta({
  titulo,
  valor,
  detalle,
  href,
  alerta,
}: {
  titulo: string;
  valor: string | number;
  detalle: string;
  href: string;
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-5 transition hover:border-marca-500 ${
        alerta ? "border-oferta/40 bg-oferta/5" : "border-borde"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">
        {titulo}
      </p>
      <p className="tabular mt-2 text-3xl font-extrabold">{valor}</p>
      <p className="mt-1 text-xs text-tinta-suave">{detalle}</p>
    </Link>
  );
}

export default async function PaginaAdmin() {
  const [
    pendientes,
    productosActivos,
    variantesSinStock,
    vendidos,
    pedidosRecientes,
    variantesBajas,
  ] = await Promise.all([
    prisma.order.count({ where: { status: { in: ESTADOS_PENDIENTES } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { stock: 0 } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "SHIPPED"] } },
      _sum: { totalCents: true },
    }),
    pedidosPorEstado(["PENDING"]),
    prisma.productVariant.findMany({
      where: { stock: { gt: 0, lte: 3 } },
      include: { product: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta
          titulo="Pedidos pendientes"
          valor={pendientes}
          detalle="Pagos sin confirmar o sin despachar"
          href="/admin/pedidos"
          alerta={pendientes > 0}
        />
        <Tarjeta
          titulo="Productos activos"
          valor={productosActivos}
          detalle="Visibles en el catálogo"
          href="/admin/productos"
        />
        <Tarjeta
          titulo="Variantes sin stock"
          valor={variantesSinStock}
          detalle="Combinaciones de talle y color agotadas"
          href="/admin/stock"
          alerta={variantesSinStock > 0}
        />
        <Tarjeta
          titulo="Facturado"
          valor={formatearPrecio(vendidos._sum.totalCents ?? 0)}
          detalle="Pedidos pagados y enviados"
          href="/admin/pedidos"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-borde p-5">
          <h2 className="font-bold">Pedidos esperando pago</h2>
          {pedidosRecientes.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-suave">
              No hay pedidos pendientes. 🎉
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-borde">
              {pedidosRecientes.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-mono text-xs">
                      #{p.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-tinta-suave">
                      {p.user?.name ?? p.user?.email} ·{" "}
                      {formatearFecha(p.createdAt)}
                    </p>
                  </div>
                  <span className="tabular text-sm font-bold">
                    {formatearPrecio(p.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/pedidos"
            className="mt-4 inline-block text-sm font-semibold text-marca-600 hover:underline"
          >
            Ver todos los pedidos
          </Link>
        </section>

        <section className="rounded-xl border border-borde p-5">
          <h2 className="font-bold">Stock por agotarse</h2>
          {variantesBajas.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-suave">
              Todo con stock suficiente.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-borde">
              {variantesBajas.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm">
                    {v.product.name}
                    <span className="block text-xs text-tinta-suave">
                      Talle {v.size} · {v.color}
                    </span>
                  </span>
                  <span className="rounded bg-oferta/10 px-2 py-1 text-xs font-bold text-oferta">
                    {v.stock} u.
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/stock"
            className="mt-4 inline-block text-sm font-semibold text-marca-600 hover:underline"
          >
            Gestionar stock
          </Link>
        </section>
      </div>
    </div>
  );
}
