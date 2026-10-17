/**
 * Pruebas de las funciones de parseo del backoffice.
 * Uso: npm run prueba:parseo
 */
import { aCentavos, aSlug } from "../lib/parseo";

let fallos = 0;

function verificar(desc: string, obtenido: unknown, esperado: unknown) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (ok) console.log(`  ✓ ${desc}`);
  else { fallos++; console.log(`  ✗ ${desc} — esperado ${JSON.stringify(esperado)}, recibido ${JSON.stringify(obtenido)}`); }
}

console.log("Precios a centavos:");
verificar("formato argentino con miles", aCentavos("29.999,20"), 2999920);
verificar("decimal con punto", aCentavos("29999.20"), 2999920);
verificar("entero", aCentavos("37499"), 3749900);
verificar("punto de miles sin coma", aCentavos("1.500"), 150000);
verificar("punto de miles con decimal", aCentavos("1.500,50"), 150050);
verificar("con espacios", aCentavos("  1500  "), 150000);
verificar("cero", aCentavos("0"), 0);
verificar("vacío es inválido", aCentavos(""), null);
verificar("texto es inválido", aCentavos("abc"), null);
verificar("negativo es inválido", aCentavos("-5"), null);
verificar("null es inválido", aCentavos(null), null);

console.log("\nSlugs:");
verificar("espacios a guiones", aSlug("Hello World"), "hello-world");
verificar("saca acentos", aSlug("Zelda: Trifuerza Súper"), "zelda-trifuerza-super");
verificar("saca signos", aSlug("Pac-Man ¿Fantasma?"), "pac-man-fantasma");
verificar("no deja guiones al borde", aSlug("  ¡Hola!  "), "hola");
verificar("recorta a 60", aSlug("a".repeat(80)).length, 60);

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
