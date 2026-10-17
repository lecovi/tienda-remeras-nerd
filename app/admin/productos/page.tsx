import type { Metadata } from "next";
import Link from "next/link";

import { alternarActivoProducto } from "@/app/actions/admin";
import { stockTotal } from "@/lib/catalogo";
import { formatearPrecio, porcentajeDescuento } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Productos" };

export default async function PaginaAdminProductos() {
  const productos = await prisma.product.findMany({
    include: { variants: { select: { stock: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Productos</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {productos.length} en total
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-marca-700"
        >
          + Crear remera
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-borde">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-humo text-left text-xs uppercase tracking-wide text-tinta-suave">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Precio</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {productos.map((p) => {
              const total = stockTotal(p.variants);
              const descuento = porcentajeDescuento(p.priceCents, p.listCents);

              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded border border-borde bg-humo object-cover"
                      />
                      <div>
                        <Link
                          href={`/producto/${p.slug}`}
                          className="font-medium hover:text-marca-600"
                        >
                          {p.name}
                        </Link>
                        <p className="font-mono text-[11px] text-tinta-suave">
                          {p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-tinta-suave">{p.category}</td>
                  <td className="tabular px-4 py-3">
                    {formatearPrecio(p.priceCents)}
                    {descuento !== null && (
                      <span className="ml-2 text-xs font-bold text-oferta">
                        -{descuento}%
                      </span>
                    )}
                  </td>
                  <td className="tabular px-4 py-3">
                    <span
                      className={
                        total === 0
                          ? "font-bold text-oferta"
                          : total <= 20
                            ? "font-bold text-amber-700"
                            : ""
                      }
                    >
                      {total} u.
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        p.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {p.isActive ? "Publicado" : "Pausado"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={alternarActivoProducto}>
                      <input type="hidden" name="productId" value={p.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-marca-600 hover:underline"
                      >
                        {p.isActive ? "Pausar" : "Publicar"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
