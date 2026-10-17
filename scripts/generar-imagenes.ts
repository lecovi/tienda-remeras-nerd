/**
 * Genera las imágenes placeholder del catálogo en public/productos/.
 *
 * El catálogo real necesita fotos; hasta entonces esto produce una remera
 * vectorial con el nombre del diseño, con el mismo nombre de archivo que
 * espera la columna Product.imageUrl. Para reemplazar: pisar el .svg por
 * la foto real y actualizar imageUrl en la base (o el seed).
 *
 * Uso: npx tsx scripts/generar-imagenes.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SALIDA = join(process.cwd(), "public", "productos");

const COLORES: Record<string, { tela: string; texto: string }> = {
  Negro: { tela: "#18181b", texto: "#fafafa" },
  Blanco: { tela: "#f4f4f5", texto: "#18181b" },
  Marino: { tela: "#1e3a8a", texto: "#fafafa" },
  Rojo: { tela: "#991b1b", texto: "#fafafa" },
};

/** Reproduce el orden de prisma/seed.ts para que cada slug tenga su archivo. */
const PRODUCTOS: Array<{ slug: string; nombre: string; color: string }> = [
  { slug: "hello-world", nombre: "HELLO WORLD", color: "Negro" },
  { slug: "mario-bros-8-bits", nombre: "MARIO BROS", color: "Rojo" },
  { slug: "zelda-trifuerza", nombre: "TRI F UERZA", color: "Marino" },
  { slug: "elegi-tu-inicial", nombre: "ELEGÍ TU INICIAL", color: "Negro" },
  { slug: "yo-soy-tu-padre", nombre: "YO SOY TU PADRE", color: "Negro" },
  { slug: "mi-vecino-totoro", nombre: "TOTORO", color: "Marino" },
  { slug: "pac-man-fantasmita", nombre: "PAC-MAN", color: "Negro" },
  { slug: "tira-iniciativa", nombre: "TIRÁ INICIATIVA", color: "Blanco" },
  { slug: "hackerman", nombre: "HACKERMAN", color: "Negro" },
  { slug: "no-puedes-pasar", nombre: "NO PODÉS PASAR", color: "Marino" },
  { slug: "sonic-retro", nombre: "SONIC", color: "Marino" },
  { slug: "la-verdad-esta-ahi-afuera", nombre: "LA VERDAD", color: "Negro" },
  { slug: "el-trepamuros", nombre: "EL TREPAMUROS", color: "Rojo" },
];

/** Escapa lo mínimo indispensable para que el SVG sea XML válido. */
function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function remera(slug: string, nombre: string, color: string): string {
  const { tela, texto } = COLORES[color] ?? COLORES.Negro;
  // Los nombres largos necesitan menos cuerpo para no salirse de la prenda.
  const tamano = nombre.length > 14 ? 26 : nombre.length > 10 ? 32 : 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480" role="img" aria-label="Remera ${escapar(nombre)}">
  <rect width="480" height="480" fill="#f4f4f5"/>
  <g transform="translate(0,10)">
    <path d="M195,55 C215,82 265,82 285,55 L350,90 L400,150 L345,200 L345,430 L135,430 L135,200 L80,150 L130,90 Z"
          fill="${tela}" stroke="#00000018" stroke-width="2"/>
    <path d="M195,55 C215,82 265,82 285,55" fill="none" stroke="#00000030" stroke-width="6" stroke-linecap="round"/>
    <text x="240" y="255" text-anchor="middle" fill="${texto}"
          font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
          font-size="${tamano}" font-weight="700" letter-spacing="1">${escapar(nombre)}</text>
  </g>
</svg>
`;
}

mkdirSync(SALIDA, { recursive: true });

for (const p of PRODUCTOS) {
  writeFileSync(join(SALIDA, `${p.slug}.svg`), remera(p.slug, p.nombre, p.color), "utf8");
  console.log(`  ✓ public/productos/${p.slug}.svg`);
}

console.log(`\n${PRODUCTOS.length} imágenes generadas en public/productos/`);
