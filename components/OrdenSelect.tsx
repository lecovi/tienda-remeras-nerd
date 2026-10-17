"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ORDENES } from "@/lib/constantes";

/**
 * El único componente de cliente del catálogo. Existe para que cambiar el
 * orden no requiera apretar un botón; el resto de los filtros son enlaces
 * normales y funcionan sin JavaScript.
 */
export function OrdenSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actual = searchParams.get("orden") ?? "recientes";

  function cambiar(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === "recientes") {
      params.delete("orden");
    } else {
      params.set("orden", valor);
    }
    const query = params.toString();
    router.push(query ? `/catalogo?${query}` : "/catalogo");
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-tinta-suave">Ordenar por</span>
      <select
        value={actual}
        onChange={(e) => cambiar(e.target.value)}
        className="rounded-lg border border-borde bg-white px-3 py-2 text-sm font-medium focus:border-marca-500 focus:outline-none"
      >
        {Object.entries(ORDENES).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}
