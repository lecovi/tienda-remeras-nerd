import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Revisá tu correo" };

/**
 * A dónde llega el usuario después de pedir el link de acceso.
 *
 * Es la página que se configura con `pages.verifyRequest` en auth.ts. Sin ella,
 * Auth.js muestra su propia pantalla en inglés.
 *
 * Es importante que exista y que no pida sesión: el usuario todavía no entró.
 */
export default function PaginaVerificar() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border border-borde p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Revisá tu correo
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
          Te mandamos un link para entrar. Hacé clic en él y quedás adentro: no
          hace falta escribir ninguna contraseña.
        </p>

        <ul className="mt-5 space-y-2 text-sm text-tinta-suave">
          <li>
            · El link <strong className="text-tinta">vence en 15 minutos</strong>{" "}
            y sirve una sola vez.
          </li>
          <li>
            · Si no lo ves, mirá en <strong className="text-tinta">spam</strong>{" "}
            o correo no deseado.
          </li>
          <li>
            · Si tardó en llegar, podés volver y pedir otro.
          </li>
        </ul>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg border border-borde px-5 py-3 text-sm font-semibold transition hover:border-tinta"
        >
          Pedir otro link
        </Link>
      </div>
    </div>
  );
}
