import type { Metadata } from "next";
import Link from "next/link";

import { actualizarStock } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Stock" };

export default async function PaginaAdminStock() {
  const variantes = await prisma.productVariant.findMany({
    include: { product: { select: { name: true, slug: true } } },
    orderBy: [{ product: { name: "asc" } }, { color: "asc" }, { size: "asc" }],
  });

  const sinStock = variantes.filter((v) => v.stock === 0).length;
  const totalUnidades = variantes.reduce((acc, v) => acc + v.stock, 0);

  return (
    <div>
      <h2 className="text-xl font-bold">Stock</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        {variantes.length} variantes · {totalUnidades} unidades ·{" "}
        {sinStock > 0 ? (
          <span className="font-semibold text-oferta">
            {sinStock} sin stock
          </span>
        ) : (
          <span className="text-exito">todas con stock</span>
        )}
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-borde">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-humo text-left text-xs uppercase tracking-wide text-tinta-suave">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Talle</th>
              <th className="px-4 py-3 font-semibold">Color</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {variantes.map((v) => (
              <tr
                key={v.id}
                className={v.stock === 0 ? "bg-oferta/5" : undefined}
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/producto/${v.product.slug}`}
                    className="font-medium hover:text-marca-600"
                  >
                    {v.product.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-semibold">{v.size}</td>
                <td className="px-4 py-2.5 text-tinta-suave">{v.color}</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-tinta-suave">
                  {v.sku}
                </td>
                <td className="px-4 py-2.5" colSpan={2}>
                  <form
                    action={actualizarStock}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="variantId" value={v.id} />
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={v.stock}
                      aria-label={`Stock de ${v.product.name} talle ${v.size} ${v.color}`}
                      className={`tabular w-20 rounded-lg border px-2 py-1.5 text-center text-sm ${
                        v.stock === 0 ? "border-oferta/50" : "border-borde"
                      }`}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-borde px-3 py-1.5 text-xs font-semibold hover:border-marca-500 hover:text-marca-600"
                    >
                      Guardar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
