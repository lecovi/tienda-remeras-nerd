import "server-only";

import { UMBRAL_ENVIO_GRATIS_CENTS } from "@/lib/constantes";
import type { ContextoCotizacion, OpcionDeEnvio } from "@/lib/envio-tipos";

/**
 * Cotización de envío.
 *
 * Está detrás de una interfaz a propósito: el día que se integre Correo
 * Argentino, Andreani o cualquier otro, se agrega un cotizador y se cambia
 * cuál devuelve `cotizadorActual()`. El checkout, el pedido y los mails no se
 * enteran del cambio.
 *
 * El cotizador implementado hoy es de tarifa plana: no depende de ningún
 * proveedor externo, así que la tienda puede vender desde el primer día.
 */

export type { ContextoCotizacion, OpcionDeEnvio } from "@/lib/envio-tipos";

export interface CotizadorDeEnvio {
  readonly nombre: string;
  cotizar(contexto: ContextoCotizacion): Promise<OpcionDeEnvio[]>;
}

/** Costos de la tarifa plana, configurables por entorno. */
function costos() {
  return {
    domicilio: Number(process.env.ENVIO_COSTO_DOMICILIO_CENTS ?? 4_500_00),
    sucursal: Number(process.env.ENVIO_COSTO_SUCURSAL_CENTS ?? 3_500_00),
  };
}

const cotizadorTarifaPlana: CotizadorDeEnvio = {
  nombre: "tarifa-plana",

  async cotizar({ totalItemsCents }) {
    const { domicilio, sucursal } = costos();
    // El envío gratis aplica a las opciones con costo, no al retiro en local
    // (que ya es gratis de por sí).
    const sinCargo = totalItemsCents >= UMBRAL_ENVIO_GRATIS_CENTS;

    return [
      {
        id: "domicilio",
        nombre: "Envío a domicilio",
        detalle: "A cualquier dirección del país",
        costoCentavos: sinCargo ? 0 : domicilio,
        plazo: "3 a 7 días hábiles",
      },
      {
        id: "sucursal",
        nombre: "Retiro en sucursal",
        detalle: "Retirás en la sucursal más cercana",
        costoCentavos: sinCargo ? 0 : sucursal,
        plazo: "3 a 7 días hábiles",
      },
      {
        id: "retiro-local",
        nombre: "Retiro en el local",
        detalle: "Av. Siempre Viva 742, de 10 a 19 h",
        costoCentavos: 0,
        plazo: "Listo en 24 h",
      },
    ];
  },
};

/**
 * Cotizadores disponibles, indexados por el valor de ENVIO_PROVEEDOR.
 * Hoy hay uno solo; esta estructura es el punto de enchufe de los reales.
 */
const COTIZADORES: Record<string, CotizadorDeEnvio> = {
  "tarifa-plana": cotizadorTarifaPlana,
};

export function cotizadorActual(): CotizadorDeEnvio {
  const elegido = process.env.ENVIO_PROVEEDOR ?? "tarifa-plana";
  const cotizador = COTIZADORES[elegido];

  if (!cotizador) {
    console.warn(
      `[envio] ENVIO_PROVEEDOR="${elegido}" no existe. Se usa tarifa plana.`,
    );
    return cotizadorTarifaPlana;
  }

  return cotizador;
}

export async function opcionesDeEnvio(
  totalItemsCents: number,
  codigoPostal?: string,
): Promise<OpcionDeEnvio[]> {
  return cotizadorActual().cotizar({ totalItemsCents, codigoPostal });
}

/**
 * Resuelve la opción elegida POR EL SERVIDOR.
 *
 * Esto es importante y es una regla de seguridad, no un detalle: el cliente
 * manda un `id` ("domicilio"), nunca un precio. Si tomáramos el costo que
 * llega desde el navegador, cualquiera podría pagar $0 manipulando el
 * formulario. El precio se recalcula acá con las mismas reglas que se
 * mostraron en pantalla.
 *
 * Devuelve la opción por defecto si el id no existe, para no dejar el pedido
 * sin envío por un dato raro.
 */
export async function resolverOpcionDeEnvio(
  id: string | undefined,
  totalItemsCents: number,
): Promise<OpcionDeEnvio> {
  const opciones = await opcionesDeEnvio(totalItemsCents);
  const opcionPorDefecto = opciones[0];

  if (!id) return opcionPorDefecto;

  return opciones.find((o) => o.id === id) ?? opcionPorDefecto;
}
