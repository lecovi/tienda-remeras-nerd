"use client";

import { useActionState } from "react";

import { entrarConDemo, type EstadoLogin } from "@/app/actions/auth";

/**
 * Acceso de prueba para desarrollo. Dos botones que envían el email del
 * perfil demo correspondiente; el rol admin habilita el backoffice.
 */
export function LoginDemo({ destino }: { destino: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoLogin, FormData>(
    entrarConDemo,
    undefined,
  );

  return (
    <div className="rounded-xl border border-dashed border-marca-500 bg-marca-50 p-5">
      <div className="flex items-center gap-2">
        <span className="rounded bg-marca-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Solo desarrollo
        </span>
      </div>

      <p className="mt-3 text-sm text-tinta-suave">
        Google y GitHub todavía no están configurados. Usá un perfil de prueba
        para recorrer el carrito, los pedidos y el backoffice.
      </p>

      <form action={accion} className="mt-4 grid gap-2 sm:grid-cols-2">
        <input type="hidden" name="destino" value={destino} />
        <button
          type="submit"
          name="email"
          value="cliente@demo.local"
          disabled={pendiente}
          className="rounded-lg border border-marca-500 bg-white px-4 py-2.5 text-sm font-semibold text-marca-700 transition hover:bg-marca-100 disabled:opacity-60"
        >
          Entrar como cliente
        </button>
        <button
          type="submit"
          name="email"
          value="admin@demo.local"
          disabled={pendiente}
          className="rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-marca-700 disabled:opacity-60"
        >
          Entrar como admin
        </button>
      </form>

      {estado?.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-oferta">
          {estado.error}
        </p>
      )}
    </div>
  );
}
