"use client";

import { useActionState } from "react";

import { entrarConEmail, type EstadoLogin } from "@/app/actions/auth";

/**
 * Acceso por email con link (link mágico).
 *
 * No hay contraseña: se escribe el email, llega un link y con eso se entra. Por
 * eso el texto no dice "registrate" ni "iniciá sesión": da igual si la cuenta
 * existe o no, el flujo es el mismo (y si no existe, se crea sola).
 */
export function LoginEmail({ destino }: { destino: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoLogin, FormData>(
    entrarConEmail,
    undefined,
  );

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="destino" value={destino} />

      <label className="block">
        <span className="text-sm font-medium">Tu email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          className="mt-1.5 w-full rounded-lg border border-borde px-4 py-3 text-sm outline-none transition focus:border-marca-500"
        />
      </label>

      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-lg bg-marca-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-marca-700 disabled:bg-borde disabled:text-tinta-suave"
      >
        {pendiente ? "Mandando el link..." : "Entrar con mi email"}
      </button>

      <p className="text-xs text-tinta-suave">
        Te mandamos un link para entrar. No hace falta elegir contraseña.
      </p>

      {estado?.error && (
        <p role="alert" className="text-sm font-medium text-oferta">
          {estado.error}
        </p>
      )}
    </form>
  );
}
