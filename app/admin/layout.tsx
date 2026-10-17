import Link from "next/link";

import { requerirAdmin } from "@/lib/sesion";

const secciones = [
  { href: "/admin", etiqueta: "Resumen" },
  { href: "/admin/pedidos", etiqueta: "Pedidos pendientes" },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/productos/nuevo", etiqueta: "Crear remera" },
  { href: "/admin/stock", etiqueta: "Stock" },
];

/**
 * El backoffice entero pasa por requerirAdmin(). Es un chequeo sobre la sesión
 * firmada, no sobre el proxy: nadie sin rol ADMIN llega a ninguna de estas
 * páginas aunque escriba la URL a mano.
 */
export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const admin = await requerirAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Backoffice</h1>
          <p className="text-sm text-tinta-suave">
            {admin.name ?? admin.email}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-borde px-4 py-2 text-sm font-medium hover:border-tinta"
        >
          Ver la tienda
        </Link>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {secciones.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-tinta-suave transition hover:bg-humo hover:text-tinta"
            >
              {s.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
