/**
 * Tipos de envío compartidos entre servidor y cliente.
 *
 * Viven en un archivo aparte, sin "server-only", porque el checkout es un
 * componente de cliente y necesita el tipo. Importar desde lib/envio.ts
 * arrastraría el módulo de servidor al bundle del navegador.
 */

export type OpcionDeEnvio = {
  id: string;
  nombre: string;
  detalle: string;
  costoCentavos: number;
  /** Texto de plazo, no una fecha: es lo que el cliente necesita saber. */
  plazo: string;
};

export type ContextoCotizacion = {
  /** Total de los productos, sin envío. Define si aplica el envío gratis. */
  totalItemsCents: number;
  /** Dato que los cotizadores reales necesitan; la tarifa plana lo ignora. */
  codigoPostal?: string;
};
