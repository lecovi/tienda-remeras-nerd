/**
 * Prueba del parseo del asistente de diseño.
 *
 * Acá no se llama a ningún modelo: se prueba lo que hacemos con lo que el
 * modelo devuelve, que es donde están los casos borde. El modelo contesta con
 * charla y con el JSON envuelto en ```json, y a veces devuelve la categoría
 * con otro nombre ("Videojuegos" en vez de "Videogames"), así que confiar en un
 * JSON.parse pelado rompería el alta en silencio.
 *
 * Lo segundo que se prueba es la validación de rutas: el cliente manda la ruta
 * de la imagen anterior y el servidor la lee del disco. Si esa validación
 * falla, se puede leer cualquier archivo del servidor.
 *
 * Y lo tercero, el guardado: que lo que se escribe se pueda volver a leer igual
 * desde una ruta nuestra, y que no se pueda leer nada de afuera.
 *
 * No se llama a ningún modelo: los tests no gastan plata ni dependen de la red.
 *
 * Uso: npm run prueba:asistente
 */
import { rm } from "node:fs/promises";
import path from "node:path";

import { guardarImagen, leerImagen } from "../lib/asistente/almacen";
import {
  esRutaGenerada,
  extraerDatos,
  nombreGenerado,
} from "../lib/asistente/parseo";

let fallos = 0;

function verificar(descripcion: string, condicion: boolean, detalle = "") {
  if (condicion) {
    console.log(`  ✓ ${descripcion}`);
  } else {
    fallos++;
    console.log(`  ✗ ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  }
}

async function main() {
  console.log("Probando el parseo de la respuesta del modelo...\n");

  // --- JSON limpio, como debería venir
  const limpio = extraerDatos(
    '{"nombre":"Hongo Retro","descripcion":"Un clásico del pixel art.","categoria":"Videogames"}',
  );
  verificar("JSON limpio: toma el nombre", limpio.nombre === "Hongo Retro");
  verificar(
    "JSON limpio: toma la descripción",
    limpio.descripcion === "Un clásico del pixel art.",
  );
  verificar(
    "JSON limpio: acepta una categoría real",
    limpio.categoria === "Videogames",
  );

  // --- Con charla alrededor y fence de markdown, que es lo que hace de verdad
  const conCharla = extraerDatos(
    "¡Claro! Acá va el diseño y la info:\n\n```json\n" +
      '{"nombre":"Nave Arcade","descripcion":"Una nave disparando.","categoria":"Retro"}\n' +
      "```\n\nEspero que te sirva.",
  );
  verificar("Con charla y fences: igual extrae el nombre", conCharla.nombre === "Nave Arcade");
  verificar("Con charla y fences: extrae la categoría", conCharla.categoria === "Retro");

  // --- Claves en inglés, que el modelo usa cuando se distrae
  const enIngles = extraerDatos(
    '{"name":"Pixel Shroom","description":"A classic.","category":"Videogames"}',
  );
  verificar("Claves en inglés: las entiende igual", enIngles.nombre === "Pixel Shroom");

  // --- Una categoría que no existe en la tienda tiene que descartarse
  const inventada = extraerDatos('{"categoria":"Videojuegos"}');
  verificar(
    "Categoría inexistente: se descarta en vez de romper el alta",
    inventada.categoria === undefined,
  );

  // --- Sin JSON pero con los campos sueltos
  const suelto = extraerDatos('nombre: "Algo suelto", descripcion: "Otra cosa", categoria: "Memes"');
  verificar("Sin JSON: rescata los campos sueltos", suelto.nombre === "Algo suelto");
  verificar("Sin JSON: también la categoría", suelto.categoria === "Memes");

  // --- Basura: no inventa datos
  const basura = extraerDatos("No pude generar nada, probá de nuevo.");
  verificar(
    "Respuesta sin datos: no inventa nombre",
    basura.nombre === undefined && basura.descripcion === undefined,
  );

  const vacio = extraerDatos("");
  verificar("Respuesta vacía: no explota y no inventa", vacio.nombre === undefined);

  // --- Normalizaciones
  const espacios = extraerDatos('{"nombre":"  Hongo    retro  "}');
  verificar("Colapsa espacios y recorta", espacios.nombre === "Hongo retro");

  const larguisimo = extraerDatos(`{"nombre":"${"a".repeat(200)}"}`);
  verificar(
    "Trunca el nombre al largo del formulario",
    larguisimo.nombre?.length === 80,
    `largo ${larguisimo.nombre?.length}`,
  );

  const numero = extraerDatos('{"nombre":123}');
  verificar("Valor que no es texto: se descarta", numero.nombre === undefined);

  const cadenaVacia = extraerDatos('{"nombre":"   "}');
  verificar("Texto en blanco: se descarta", cadenaVacia.nombre === undefined);

  console.log("\nProbando la validación de rutas de imágenes...\n");

  // --- Rutas que sí son nuestras
  verificar("/productos/generados/abc.png es válida", esRutaGenerada("/productos/generados/abc.png"));
  verificar(
    "una ruta con guiones y números es válida",
    esRutaGenerada("/productos/generados/a1b2-c3d4.png"),
  );
  verificar("un .jpeg es válido", esRutaGenerada("/productos/generados/foto.jpeg"));

  // --- Rutas que NO
  verificar(
    "una imagen del catálogo NO es una generada",
    !esRutaGenerada("/productos/mi-diseno.svg"),
  );
  verificar(
    "no se puede salir del directorio con ..",
    !esRutaGenerada("/productos/generados/../../.env"),
  );
  verificar(
    "un dominio externo NO es una ruta generada",
    !esRutaGenerada("https://sitio-falso.com/x.png"),
  );
  verificar("un SVG generado NO se acepta", !esRutaGenerada("/productos/generados/abc.svg"));
  verificar(
    "no se aceptan subdirectorios",
    !esRutaGenerada("/productos/generados/sub/abc.png"),
  );
  verificar(
    "no se aceptan parámetros en la ruta",
    !esRutaGenerada("/productos/generados/abc.png?x=1"),
  );
  verificar("una cadena vacía NO es válida", !esRutaGenerada(""));

  // --- El nombre de archivo que devuelve, o null
  verificar(
    "devuelve el nombre de archivo de una ruta válida",
    nombreGenerado("/productos/generados/abc.png") === "abc.png",
  );
  verificar(
    "devuelve null para una ruta inválida",
    nombreGenerado("/productos/generados/../../.env") === null,
  );

  console.log("\nProbando el guardado de las imágenes generadas...\n");

  // PNG 1x1 transparente: el archivo PNG válido más chico que existe.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  const guardada = await guardarImagen(png, "image/png");
  verificar("devuelve una ruta generada", esRutaGenerada(guardada), guardada);

  const releida = await leerImagen(guardada);
  verificar("la imagen queda guardada en disco", releida !== null);
  verificar(
    "los bytes vuelven iguales",
    releida !== null && releida.datos.equals(png),
  );
  verificar("conserva el tipo de imagen", releida?.mime === "image/png");

  verificar(
    "no lee una ruta que se escapa del directorio",
    (await leerImagen("/productos/generados/../../.env")) === null,
  );
  verificar(
    "no lee una imagen del catálogo",
    (await leerImagen("/productos/mi-diseno.svg")) === null,
  );
  verificar(
    "devuelve null si el archivo no existe",
    (await leerImagen("/productos/generados/no-existe-1234.png")) === null,
  );

  // No dejar basura en public/.
  await rm(path.join(process.cwd(), "public", guardada), { force: true });

  console.log(
    fallos === 0
      ? "\nTodo bien: el parseo y la validación de rutas se comportan como se espera."
      : `\n${fallos} comprobación(es) fallaron.`,
  );

  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
