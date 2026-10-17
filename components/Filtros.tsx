import Link from "next/link";

import { TALLES } from "@/lib/constantes";

/** Muestra de color para el filtro lateral. */
const HEX_COLOR: Record<string, string> = {
  Negro: "#18181b",
  Blanco: "#ffffff",
  Marino: "#1e3a8a",
  Rojo: "#991b1b",
};

type Props = {
  /** Conteo de productos activos por categoría. */
  conteos: Record<string, number>;
  /** Valores activos, para resaltar lo seleccionado. */
  actual: { categoria?: string; talle?: string; color?: string };
  /** URLs ya resueltas por la página, para no duplicar la lógica de query string. */
  enlaces: {
    categorias: { valor: string; url: string; activo: boolean }[];
    talles: { valor: string; url: string; activo: boolean }[];
    colores: { valor: string; url: string; activo: boolean }[];
    limpiar: string;
  };
};

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-borde pb-5">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{titulo}</h3>
      {children}
    </div>
  );
}

export function Filtros({ conteos, actual, enlaces }: Props) {
  const hayFiltros = Boolean(actual.categoria || actual.talle || actual.color);

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Filtrar</h2>
        {hayFiltros && (
          <Link href={enlaces.limpiar} className="text-xs text-marca-600 hover:underline">
            Limpiar
          </Link>
        )}
      </div>

      <Grupo titulo="Categorías">
        <ul className="space-y-1.5 text-sm">
          {enlaces.categorias.map((c) => (
            <li key={c.valor}>
              <Link
                href={c.url}
                aria-current={c.activo ? "true" : undefined}
                className={
                  c.activo
                    ? "font-semibold text-marca-600"
                    : "text-tinta-suave hover:text-tinta"
                }
              >
                {c.valor}{" "}
                <span className="text-xs text-tinta-suave">
                  ({conteos[c.valor] ?? 0})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Grupo>

      <Grupo titulo="Talle">
        <div className="flex flex-wrap gap-2">
          {enlaces.talles.map((t) => (
            <Link
              key={t.valor}
              href={t.url}
              aria-current={t.activo ? "true" : undefined}
              className={`min-w-11 rounded-lg border px-3 py-1.5 text-center text-sm ${
                t.activo
                  ? "border-marca-600 bg-marca-50 font-semibold text-marca-700"
                  : "border-borde hover:border-marca-500"
              }`}
            >
              {t.valor}
            </Link>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Color">
        <ul className="space-y-2 text-sm">
          {enlaces.colores.map((c) => (
            <li key={c.valor}>
              <Link
                href={c.url}
                aria-current={c.activo ? "true" : undefined}
                className={`flex items-center gap-2 ${
                  c.activo
                    ? "font-semibold text-marca-600"
                    : "text-tinta-suave hover:text-tinta"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-borde"
                  style={{ background: HEX_COLOR[c.valor] ?? "#d4d4d8" }}
                  aria-hidden
                />
                {c.valor}
              </Link>
            </li>
          ))}
        </ul>
      </Grupo>

      <Grupo titulo="Talles disponibles">
        <p className="text-xs text-tinta-suave">
          {TALLES.join(" · ")}
        </p>
      </Grupo>
    </aside>
  );
}
