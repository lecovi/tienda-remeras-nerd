"use client";

import { useActionState, useState } from "react";

import { crearProducto, type EstadoAdmin } from "@/app/actions/admin";
import {
  AsistenteDiseno,
  type PropuestaElegida,
} from "@/components/AsistenteDiseno";
import { CATEGORIAS, COLORES, TALLES } from "@/lib/constantes";

const campo =
  "mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm focus:border-marca-500 focus:outline-none";

function ErrorCampo({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null;
  return <p className="mt-1 text-xs font-medium text-oferta">{mensajes[0]}</p>;
}

export function FormularioProducto({
  asistenteDisponible,
}: {
  asistenteDisponible: boolean;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoAdmin, FormData>(
    crearProducto,
    {},
  );

  // El stock se pide por talle y se replica a cada color elegido.
  const [colores, setColores] = useState<string[]>(["Negro"]);

  // Estos cuatro campos son controlados porque el asistente los completa.
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [imagenUrl, setImagenUrl] = useState("");

  function alternarColor(color: string) {
    setColores((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color],
    );
  }

  // El nombre, la descripción y la categoría pueden no venir; la imagen sí o sí.
  // Si el modelo no los mandó, se dejan como estaban en vez de pisarlos con nada.
  function usarPropuesta(propuesta: PropuestaElegida) {
    if (propuesta.nombre) setNombre(propuesta.nombre);
    if (propuesta.descripcion) setDescripcion(propuesta.descripcion);
    if (propuesta.categoria) setCategoria(propuesta.categoria);
    setImagenUrl(propuesta.imagenUrl);
  }

  return (
    <form action={accion} className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-borde p-5">
        <h2 className="font-bold">Diseño</h2>
        <p className="mt-1 text-xs text-tinta-suave">
          Describile el estampado y el asistente te devuelve la imagen. Podés
          pedirle cambios sobre esa misma imagen.
        </p>
        <div className="mt-4">
          <AsistenteDiseno
            disponible={asistenteDisponible}
            onUsar={usarPropuesta}
          />
        </div>
      </section>

      <section className="rounded-xl border border-borde p-5">
        <h2 className="font-bold">Datos del producto</h2>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Nombre</span>
            <input
              name="name"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Mario Bros 8 bits"
              className={campo}
            />
            <ErrorCampo mensajes={estado?.errores?.name} />
          </label>

          <label className="block text-sm">
            <span className="font-medium">Descripción</span>
            <textarea
              name="description"
              rows={3}
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Contá de qué se trata el diseño..."
              className={campo}
            />
            <ErrorCampo mensajes={estado?.errores?.description} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Categoría</span>
              <select
                name="category"
                value={categoria}
                onChange={(evento) => setCategoria(evento.target.value)}
                className={campo}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ErrorCampo mensajes={estado?.errores?.categoria} />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Imagen (ruta o URL)</span>
              <input
                name="imageUrl"
                value={imagenUrl}
                onChange={(evento) => setImagenUrl(evento.target.value)}
                placeholder="/productos/mi-diseno.svg"
                className={campo}
              />
              <ErrorCampo mensajes={estado?.errores?.imageUrl} />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Precio de venta</span>
              <input name="price" placeholder="29999,20" className={campo} />
              <ErrorCampo mensajes={estado?.errores?.price} />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Precio de lista (opcional)</span>
              <input name="listPrice" placeholder="37499" className={campo} />
              <p className="mt-1 text-xs text-tinta-suave">
                Si es mayor al de venta, se muestra el badge de descuento.
              </p>
              <ErrorCampo mensajes={estado?.errores?.listPrice} />
            </label>
          </div>

          {imagenUrl && (
            <div>
              <span className="text-sm font-medium">Vista previa</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenUrl}
                alt="Vista previa del estampado"
                className="mt-2 h-32 w-32 rounded-lg border border-borde bg-humo object-cover"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="freeShipping" defaultChecked />
            <span>Ofrece envío gratis</span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-borde p-5">
        <h2 className="font-bold">Colores y stock</h2>
        <p className="mt-1 text-xs text-tinta-suave">
          Se crea una variante por cada combinación de color y talle.
        </p>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Colores</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {COLORES.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="colores"
                  value={c}
                  checked={colores.includes(c)}
                  onChange={() => alternarColor(c)}
                  className="h-4 w-4"
                />
                {c}
              </label>
            ))}
          </div>
          <ErrorCampo mensajes={estado?.errores?.colores} />
        </fieldset>

        <div className="mt-5">
          <p className="text-sm font-medium">Stock inicial por talle</p>
          <div className="mt-2 grid grid-cols-5 gap-3">
            {TALLES.map((t) => (
              <label key={t} className="block text-sm">
                <span className="text-xs text-tinta-suave">{t}</span>
                <input
                  name={`stock_${t}`}
                  inputMode="numeric"
                  defaultValue="0"
                  className="mt-1 w-full rounded-lg border border-borde px-2 py-1.5 text-center text-sm"
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-lg bg-marca-600 px-6 py-3 text-sm font-bold text-white hover:bg-marca-700 disabled:opacity-60"
        >
          {pendiente ? "Creando..." : "Crear remera"}
        </button>

        {estado?.ok && (
          <p role="status" className="text-sm font-medium text-exito">
            {estado.ok}
          </p>
        )}
        {estado?.error && (
          <p role="alert" className="text-sm font-medium text-oferta">
            {estado.error}
          </p>
        )}
      </div>
    </form>
  );
}
