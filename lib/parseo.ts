/**
 * Funciones puras de parseo del backoffice.
 *
 * Viven fuera de app/actions/admin.ts a propósito: un archivo con "use server"
 * solo puede exportar funciones async, así que ahí adentro no se pueden probar
 * ni reutilizar.
 */

/**
 * Convierte un precio escrito por una persona a centavos.
 *
 * El problema real: el punto y la coma cambian de significado según cómo se
 * escriba el número, y un error acá multiplica el precio por 100.
 *
 * Criterio (convención argentina):
 *  - Si hay coma, la coma es el decimal y los puntos son separadores de miles.
 *    "29.999,20" -> 2999920
 *  - Si no hay coma, un único punto seguido de 1 o 2 dígitos es decimal.
 *    "29999.20" -> 2999920
 *  - Cualquier otro punto se toma como separador de miles.
 *    "1.500" -> 150000
 *
 * Devuelve null si el valor no es un número válido o es negativo.
 */
export function aCentavos(entrada: unknown): number | null {
  if (typeof entrada !== "string") return null;

  let limpio = entrada.trim();
  if (!limpio) return null;

  if (limpio.includes(",")) {
    // Coma decimal: los puntos son de miles.
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else {
    // Sin coma: solo un punto con 1 o 2 decimales se considera decimal.
    const coincidencia = /^(\d+)\.(\d{1,2})$/.exec(limpio);
    limpio = coincidencia
      ? `${coincidencia[1]}.${coincidencia[2]}`
      : limpio.replace(/\./g, "");
  }

  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero < 0) return null;

  return Math.round(numero * 100);
}

/** "Zelda: Trifuerza Súper" -> "zelda-trifuerza-super" */
export function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
