"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { pedirDiseno } from "@/app/actions/asistente";

export type PropuestaElegida = {
  imagenUrl: string;
  nombre?: string;
  descripcion?: string;
  categoria?: string;
};

type Mensaje = {
  rol: "usuario" | "asistente";
  texto: string;
  imagenUrl?: string;
};

type Props = {
  disponible: boolean;
  onUsar: (propuesta: PropuestaElegida) => void;
};

/**
 * Diálogo de chat para diseñar el estampado.
 *
 * La conversación vive acá y no en el servidor: cada pedido se manda suelto y
 * lo único que viaja como contexto es la última imagen. Alcanza para iterar
 * ("cambiale el color", "agregale una frase") sin que el servidor tenga que
 * guardar historial de nadie.
 *
 * El diálogo se monta con un portal en el body, no donde está el botón. No es
 * capricho: el botón vive dentro del formulario del producto y el chat tiene su
 * propio formulario, y un formulario adentro de otro es HTML inválido (el
 * navegador descarta el de adentro y React se queja al hidratar). El portal lo
 * saca de ese árbol.
 */
export function AsistenteDiseno({ disponible, onUsar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [propuesta, setPropuesta] = useState<PropuestaElegida | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `document` no existe en el servidor, así que el portal se monta recién en
  // el cliente. useSyncExternalStore es la forma de preguntar "¿estoy en el
  // cliente?" sin un setState dentro de un efecto: devuelve false al renderizar
  // en el servidor, true en el cliente, y no provoca un render de más.
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function abrir() {
    setError(null);
    dialogo.current?.showModal();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    const pedido = texto.trim();
    if (!pedido || enviando) return;

    setError(null);
    setMensajes((previo) => [...previo, { rol: "usuario", texto: pedido }]);
    setTexto("");
    setEnviando(true);

    // La imagen anterior va como contexto: es lo que convierte este pedido en
    // un ajuste sobre lo que ya está en pantalla, y no en un diseño nuevo.
    const resultado = await pedirDiseno(pedido, propuesta?.imagenUrl);

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setPropuesta(resultado);
    setMensajes((previo) => [
      ...previo,
      {
        rol: "asistente",
        texto: resultado.nombre ?? "Listo, mirá la propuesta.",
        imagenUrl: resultado.imagenUrl,
      },
    ]);
  }

  function usar() {
    if (!propuesta) return;
    onUsar(propuesta);
    dialogo.current?.close();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={abrir}
          disabled={!disponible}
          className="rounded-lg border border-marca-600 px-4 py-2 text-sm font-semibold text-marca-700 hover:bg-marca-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✨ Diseñar con el asistente
        </button>
        {!disponible && (
          <p className="text-xs text-tinta-suave">
            Falta la credencial del asistente en el servidor.
          </p>
        )}
      </div>

      {montado &&
        createPortal(
          <dialog
            ref={dialogo}
            className="w-[min(44rem,92vw)] rounded-xl border border-borde p-0 backdrop:bg-black/40"
          >
            <div className="flex items-center justify-between border-b border-borde px-5 py-3">
              <h3 className="font-bold">Asistente de diseño</h3>
              <button
                type="button"
                onClick={() => dialogo.current?.close()}
                className="rounded-lg px-2 py-1 text-sm text-tinta-suave hover:bg-humo"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
              {mensajes.length === 0 && (
                <p className="text-sm text-tinta-suave">
                  Contame qué querés en la remera. Por ejemplo: «un hongo
                  pixelado de un juego de plataformas retro». Después podés
                  pedir cambios sobre esa misma imagen: «cambiale el sombrero a
                  azul», «agregá la palabra RETRO abajo».
                </p>
              )}

              <ul aria-live="polite" className="space-y-4">
                {mensajes.map((mensaje, indice) => (
                  <li
                    key={indice}
                    className={mensaje.rol === "usuario" ? "text-right" : "text-left"}
                  >
                    <p
                      className={
                        mensaje.rol === "usuario"
                          ? "ml-auto inline-block max-w-[85%] rounded-lg bg-marca-600 px-3 py-2 text-left text-sm text-white"
                          : "inline-block max-w-[85%] rounded-lg bg-humo px-3 py-2 text-sm"
                      }
                    >
                      {mensaje.texto}
                    </p>
                    {mensaje.imagenUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mensaje.imagenUrl}
                        alt="Propuesta de estampado"
                        className="mt-2 w-56 rounded-lg border border-borde"
                      />
                    )}
                  </li>
                ))}
              </ul>

              {enviando && (
                <p className="text-sm text-tinta-suave">Generando el diseño…</p>
              )}

              {error && (
                <p role="alert" className="text-sm font-medium text-oferta">
                  {error}
                </p>
              )}
            </div>

            {propuesta && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borde bg-humo px-5 py-3">
                <p className="text-xs text-tinta-suave">
                  Se completa el nombre, la descripción, la categoría y la imagen.
                </p>
                <button
                  type="button"
                  onClick={usar}
                  className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-bold text-white hover:bg-marca-700"
                >
                  Usar esta propuesta
                </button>
              </div>
            )}

            <form
              onSubmit={enviar}
              className="flex gap-2 border-t border-borde px-5 py-3"
            >
              <input
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                placeholder="Describí el diseño o pedí un cambio…"
                className="w-full rounded-lg border border-borde px-3 py-2 text-sm focus:border-marca-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={enviando || texto.trim().length === 0}
                className="shrink-0 rounded-lg bg-marca-600 px-4 py-2 text-sm font-bold text-white hover:bg-marca-700 disabled:opacity-50"
              >
                {enviando ? "…" : "Enviar"}
              </button>
            </form>
          </dialog>,
          document.body,
        )}
    </>
  );
}
