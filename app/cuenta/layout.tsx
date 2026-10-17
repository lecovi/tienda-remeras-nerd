import Link from "next/link";

import { requerirUsuario } from "@/lib/sesion";

const enlaces = [
  { href: "/cuenta/pedidos", etiqueta: "Mis pedidos" },
  { href: "/cuenta/medios-de-pago", etiqueta: "Medios de pago" },
];

/** Todas las páginas de /cuenta exigen sesión. */
export default async function LayoutCuenta({ children }: LayoutProps<"/cuenta">) {
  await requerirUsuario();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Mi cuenta</h1>

      <nav className="mt-5 flex gap-5 border-b border-borde text-sm">
        {enlaces.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="border-b-2 border-transparent pb-2 font-medium text-tinta-suave hover:border-marca-500 hover:text-tinta"
          >
            {e.etiqueta}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
