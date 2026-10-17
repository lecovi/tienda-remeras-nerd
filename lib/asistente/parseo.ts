import { CATEGORIAS, type Categoria } from "@/lib/constantes";

const LARGO_NOMBRE = 80;
const LARGO_DESCRIPCION = 600;

/** Prefijo público de las imágenes que genera el asistente. */
export const PREFIJO_GENERADOS = "/productos/generados";

const RUTA_GENERADA = /^\/productos\/generados\/[A-Za-z0-9._-]+\.(png|jpe?g|webp)$/;

/**
 * ¿La ruta apunta a una imagen que generó el asistente?
 *
 * Es una defensa, no una comodidad. El cliente manda esta ruta para que el
 * servidor lea la imagen anterior y se la pase al modelo como referencia. Sin
 * este chequeo, alguien con acceso al backoffice —o un XSS en esa página—
 * podría mandar "../../.env" y hacer que el servidor se lo entregue a Google.
 */
export function esRutaGenerada(url: string): boolean {
  return RUTA_GENERADA.test(url) && !url.includes("..");
}

/** Nombre de archivo dentro de /productos/generados, o null si la ruta no sirve. */
export function nombreGenerado(url: string): string | null {
  return esRutaGenerada(url) ? url.slice(PREFIJO_GENERADOS.length + 1) : null;
}

export type DatosPropuesta = {
  nombre?: string;
  descripcion?: string;
  categoria?: Categoria;
};

type Crudo = Record<string, unknown>;

function limpiar(valor: unknown, max: number): string | undefined {
  if (typeof valor !== "string") return undefined;
  const texto = valor.trim().replace(/\s+/g, " ");
  return texto ? texto.slice(0, max) : undefined;
}

function normalizar(crudo: Crudo): DatosPropuesta {
  const categoriaCruda = crudo.categoria ?? crudo.category;
  const categoria =
    typeof categoriaCruda === "string" &&
    (CATEGORIAS as readonly string[]).includes(categoriaCruda)
      ? (categoriaCruda as Categoria)
      : undefined;

  return {
    nombre: limpiar(crudo.nombre ?? crudo.name, LARGO_NOMBRE),
    descripcion: limpiar(crudo.descripcion ?? crudo.description, LARGO_DESCRIPCION),
    categoria,
  };
}

/**
 * Saca nombre, descripción y categoría de la respuesta del modelo.
 *
 * El modelo contesta con charla alrededor de un JSON envuelto en ```json, así
 * que un JSON.parse pelado no alcanza: se pelan las cercas y se corta desde la
 * primera llave hasta la última. Si eso falla, se buscan los campos de a uno.
 *
 * La categoría solo se acepta si es una de la tienda. El modelo devuelve
 * seguido "Videojuegos" cuando la categoría real es "Videogames", y una
 * categoría inventada rompería el alta.
 */
export function extraerDatos(respuesta: string): DatosPropuesta {
  const sinCercas = respuesta.replace(/```(?:json)?/gi, " ");
  const inicio = sinCercas.indexOf("{");
  const fin = sinCercas.lastIndexOf("}");

  if (inicio !== -1 && fin > inicio) {
    try {
      const crudo: unknown = JSON.parse(sinCercas.slice(inicio, fin + 1));
      if (crudo && typeof crudo === "object" && !Array.isArray(crudo)) {
        return normalizar(crudo as Crudo);
      }
    } catch {
      // Se intenta por los campos sueltos, más abajo.
    }
  }

  const suelto: Crudo = {};
  const patrones = [
    ["nombre", /"?nombre"?\s*:\s*"([^"]+)"/i],
    ["descripcion", /"?descripcion"?\s*:\s*"([^"]+)"/i],
    ["categoria", /"?categoria"?\s*:\s*"([^"]+)"/i],
  ] as const;

  for (const [clave, patron] of patrones) {
    const encontrado = sinCercas.match(patron);
    if (encontrado) suelto[clave] = encontrado[1];
  }

  return normalizar(suelto);
}
