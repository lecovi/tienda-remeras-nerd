"use client";

import { useActionState } from "react";

import { agregarMedio, type EstadoMedioPago } from "@/app/actions/mediosDePago";

const campo =
  "mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm focus:border-marca-500 focus:outline-none";

function ErrorCampo({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null;
  return (
    <p className="mt-1 text-xs font-medium text-oferta">{mensajes[0]}</p>
  );
}

export function FormularioTarjeta() {
  const [estado, accion, pendiente] = useActionState<EstadoMedioPago, FormData>(
    agregarMedio,
    {},
  );

  return (
    <form action={accion} className="rounded-xl border border-borde p-5">
      <h2 className="font-bold">Agregar tarjeta</h2>
      <p className="mt-1 text-xs text-tinta-suave">
        Guardamos solo la marca, los últimos 4 dígitos y el vencimiento. Nunca
        el número completo ni el código de seguridad.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Marca</span>
          <select name="brand" className={campo} defaultValue="Visa">
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="Amex">American Express</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Últimos 4 dígitos</span>
          <input
            name="last4"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            className={campo}
          />
          <ErrorCampo mensajes={estado?.errores?.last4} />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Mes de vencimiento</span>
          <input
            name="expMonth"
            inputMode="numeric"
            placeholder="12"
            className={campo}
          />
          <ErrorCampo mensajes={estado?.errores?.expMonth} />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Año de vencimiento</span>
          <input
            name="expYear"
            inputMode="numeric"
            placeholder={String(new Date().getFullYear() + 2)}
            className={campo}
          />
          <ErrorCampo mensajes={estado?.errores?.expYear} />
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Titular</span>
          <input
            name="holder"
            placeholder="Como figura en la tarjeta"
            className={campo}
          />
          <ErrorCampo mensajes={estado?.errores?.holder} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pendiente}
        className="mt-5 rounded-lg bg-marca-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-marca-700 disabled:opacity-60"
      >
        {pendiente ? "Guardando..." : "Guardar tarjeta"}
      </button>

      {estado?.ok && (
        <p role="status" className="mt-3 text-sm font-medium text-exito">
          Tarjeta guardada.
        </p>
      )}
    </form>
  );
}
