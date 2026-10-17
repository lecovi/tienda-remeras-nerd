/**
 * Utilidades de navegación.
 *
 * Vive acá y no en app/actions/auth.ts porque los archivos "use server" solo
 * pueden exportar funciones async, y esto es una función pura que usan tanto la
 * acción (al validar) como la página de login (al renderizar el campo oculto).
 */

/**
 * Devuelve la ruta si es interna, y "/" en cualquier otro caso.
 *
 * Es una defensa contra el redirect abierto: si el destino de después del login
 * saliera tal cual del query string, un link como /login?destino=https://sitio-falso.com
 * haría que la víctima entre a la tienda y termine en otro sitio. "//evil.com"
 * también se rechaza porque es una URL absoluta disfrazada de ruta interna.
 */
export function rutaInterna(valor: unknown): string {
  if (typeof valor !== "string") return "/";
  if (!valor.startsWith("/") || valor.startsWith("//")) return "/";
  return valor;
}
