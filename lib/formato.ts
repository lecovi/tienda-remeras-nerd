/**
 * Precios: en toda la app se guardan y circulan en centavos (enteros).
 * Los pesos se calculan solo para mostrar, así no se acumulan errores
 * de redondeo en los totales del carrito.
 */

const formateadorARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatearPrecio(centavos: number): string {
  return formateadorARS.format(centavos / 100);
}

/** "20% OFF" si el precio de lista es mayor al de venta; null si no hay descuento. */
export function porcentajeDescuento(
  precioCents: number,
  listaCents: number | null,
): number | null {
  if (!listaCents || listaCents <= precioCents) return null;
  return Math.round((1 - precioCents / listaCents) * 100);
}

export const CUOTAS = 6;

/** Valor de cada cuota sin interés, redondeado a centavos. */
export function valorCuota(centavos: number): string {
  return formatearPrecio(Math.round(centavos / CUOTAS));
}

export function resumenCuotas(centavos: number): string {
  return `${CUOTAS} cuotas sin interés de ${valorCuota(centavos)}`;
}

/** Fecha corta para el backoffice: 17/10/2026 18:39 */
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}
