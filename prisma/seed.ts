/**
 * Seed de catálogo: 13 remeras nerd con sus variantes de talle y color.
 *
 * Se ejecuta con: npm run db:seed
 * Es idempotente: borra el catálogo previo antes de insertar (no toca
 * usuarios, pedidos ni carritos, así que es seguro re-ejecutarlo en desarrollo).
 */
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TALLES = ["S", "M", "L", "XL", "XXL"] as const;

type Semilla = {
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number; // en centavos
  lista?: number; // precio "antes", en centavos
  categoria: string;
  colores: string[];
  /** Stock base por talle; se desordena un poco para que el backoffice sea realista. */
  stockBase: number;
  /** Variantes que quedan sin stock, para poder probar el estado "agotado". */
  sinStock?: string[]; // formato "TALLE|COLOR"
};

const CATALOGO: Semilla[] = [
  {
    nombre: "Hello World",
    slug: "hello-world",
    descripcion:
      "El primer programa de toda persona que escribe código, ahora en formato remera. Ideal para arrancar la mañana con un clásico que todo dev reconoce a la legua.",
    precio: 2799920,
    lista: 3499900,
    categoria: "Retro",
    colores: ["Negro", "Blanco"],
    stockBase: 40,
  },
  {
    nombre: "Mario Bros 8 bits",
    slug: "mario-bros-8-bits",
    descripcion:
      "El bigote más famoso del mundo en versión pixelada. Un homenaje a las tardes de Family Game y a la generación que aprendió a saltar sobre tortugas.",
    precio: 2999920,
    lista: 3749900,
    categoria: "Videogames",
    colores: ["Negro", "Rojo", "Marino"],
    stockBase: 35,
  },
  {
    nombre: "Zelda Trifuerza",
    slug: "zelda-trifuerza",
    descripcion:
      "Valor, sabiduría y poder en un solo estampado. Para quienes todavía guardan el mapa de Hyrule dibujado en una servilleta.",
    precio: 2999920,
    categoria: "Videogames",
    colores: ["Negro", "Marino"],
    stockBase: 30,
  },
  {
    nombre: "Elegí tu inicial",
    slug: "elegi-tu-inicial",
    descripcion:
      "Planta, fuego o agua: la decisión más difícil de la infancia. Estampa con los tres iniciales clásicos para reabrir el debate en cada asado.",
    precio: 3199920,
    lista: 3999900,
    categoria: "Cómics y Animé",
    colores: ["Negro", "Blanco", "Rojo"],
    stockBase: 45,
  },
  {
    nombre: "Yo soy tu padre",
    slug: "yo-soy-tu-padre",
    descripcion:
      "La revelación más famosa del cine, impresa para usar todos los días. Incluye la tipografía retro de la placa inicial.",
    precio: 2999920,
    categoria: "Cine y series",
    colores: ["Negro"],
    stockBase: 25,
  },
  {
    nombre: "Mi vecino Totoro",
    slug: "mi-vecino-totoro",
    descripcion:
      "El espíritu del bosque bajo la lluvia, en un diseño suave y minimalista. Un clásico del estudio que crió a más de una generación.",
    precio: 3399920,
    lista: 4249900,
    categoria: "Cómics y Animé",
    colores: ["Blanco", "Marino"],
    stockBase: 28,
  },
  {
    nombre: "Pac-Man Fantasmita",
    slug: "pac-man-fantasmita",
    descripcion:
      "Waka waka waka. Los cuatro fantasmas persiguiendo la pastilla amarilla, con la paleta neón de los arcades de los ochenta.",
    precio: 2799920,
    categoria: "Videogames",
    colores: ["Negro", "Marino"],
    stockBase: 20,
    sinStock: ["S|Marino", "XXL|Negro"],
  },
  {
    nombre: "Tirá iniciativa",
    slug: "tira-iniciativa",
    descripcion:
      "El d20 en pleno lanzamiento. Para mesas de rol que se extienden hasta que sale el sol y para másters que ya no saben dónde meter la próxima emboscada.",
    precio: 2999920,
    categoria: "Literatura y Juguetes",
    colores: ["Negro", "Blanco"],
    stockBase: 22,
  },
  {
    nombre: "Hackerman",
    slug: "hackerman",
    descripcion:
      "Dos teclados y una mirada al vacío. La estampa meme definitiva para quien alguna vez dijo 'en mi máquina anda'.",
    precio: 2799920,
    lista: 3499900,
    categoria: "Memes",
    colores: ["Negro", "Blanco", "Marino"],
    stockBase: 50,
  },
  {
    nombre: "No puedes pasar",
    slug: "no-puedes-pasar",
    descripcion:
      "Un puente angosto, un mago y una frase que se usa más en reuniones que en la Tierra Media. Ilustración inspirada en el estilo de portada clásica.",
    precio: 2999920,
    categoria: "Cine y series",
    colores: ["Negro", "Marino"],
    stockBase: 26,
  },
  {
    nombre: "Sonic Retro",
    slug: "sonic-retro",
    descripcion:
      "Velocidad en 16 bits con el erizo más rápido de los noventa. Diseño con anillos y cuadrícula, como en el primer nivel.",
    precio: 2899920,
    categoria: "Videogames",
    colores: ["Marino", "Rojo"],
    stockBase: 18,
    sinStock: ["L|Marino"],
  },
  {
    nombre: "La verdad está ahí afuera",
    slug: "la-verdad-esta-ahi-afuera",
    descripcion:
      "La legendaria X roja y la frase que alimentó décadas de teorías. Perfecta para quienes miran el cielo un rato de más.",
    precio: 3199920,
    lista: 3999900,
    categoria: "Cine y series",
    colores: ["Negro", "Blanco"],
    stockBase: 24,
  },
  {
    nombre: "El trepamuros",
    slug: "el-trepamuros",
    descripcion:
      "Con gran poder viene una remera que se usa hasta que se gasta el estampado. Diseño de cómic con trama de puntos y colores planos.",
    precio: 3299920,
    categoria: "Cómics y Animé",
    colores: ["Rojo", "Marino", "Negro"],
    stockBase: 32,
  },
];

async function main() {
  console.log("Sembrando catálogo...");

  // Solo se limpia el catálogo. Los pedidos referencian variantes con
  // onDelete: SetNull, así que el historial no se pierde.
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  for (const s of CATALOGO) {
    const sinStock = new Set(s.sinStock ?? []);

    await prisma.product.create({
      data: {
        name: s.nombre,
        slug: s.slug,
        description: s.descripcion,
        priceCents: s.precio,
        listCents: s.lista ?? null,
        imageUrl: `/productos/${s.slug}.svg`,
        category: s.categoria,
        freeShipping: true,
        variants: {
          create: s.colores.flatMap((color, ci) =>
            TALLES.map((talle, ti) => {
              const clave = `${talle}|${color}`;
              // Variación determinística: evita Math.random y que el seed
              // dé números distintos en cada corrida.
              const variacion = (ci * 7 + ti * 5) % 11;
              const stock = sinStock.has(clave)
                ? 0
                : Math.max(0, s.stockBase - variacion * 2);
              return {
                size: talle,
                color,
                stock,
                sku: `${s.slug.toUpperCase().slice(0, 8)}-${talle}-${color.slice(0, 3).toUpperCase()}`,
              };
            }),
          ),
        },
      },
    });
    console.log(`  ✓ ${s.nombre}`);
  }

  const total = await prisma.product.count();
  const variantes = await prisma.productVariant.count();
  console.log(`\nListo: ${total} productos y ${variantes} variantes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
