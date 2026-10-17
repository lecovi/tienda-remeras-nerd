import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { nombreGenerado, PREFIJO_GENERADOS } from "@/lib/asistente/parseo";

/**
 * Dónde viven las imágenes que genera el asistente.
 *
 * Hoy es el disco: `public/productos/generados/`. Sirve para desarrollo y para
 * un servidor propio (VPS). NO sirve para serverless: ahí el sistema de
 * archivos es de solo lectura y efímero, y la imagen desaparecería en el
 * próximo deploy. Para ese caso hay que reemplazar este archivo por una
 * implementación contra un blob store (S3, Vercel Blob, R2). Son dos funciones
 * y es el único lugar del asistente que toca el almacenamiento.
 */
const DIRECTORIO = path.join(process.cwd(), "public", "productos", "generados");

const EXTENSIONES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function guardarImagen(datos: Buffer, mime: string): Promise<string> {
  const extension = EXTENSIONES[mime] ?? "png";
  const nombre = `${randomUUID()}.${extension}`;
  await mkdir(DIRECTORIO, { recursive: true });
  await writeFile(path.join(DIRECTORIO, nombre), datos);
  return `${PREFIJO_GENERADOS}/${nombre}`;
}

/**
 * Lee una imagen generada para volver a pasársela al modelo.
 *
 * El nombre pasa por `nombreGenerado`, que rechaza cualquier cosa que no sea
 * un archivo nuestro: acá es donde se corta un intento de leer algo de afuera
 * del directorio.
 */
export async function leerImagen(
  url: string,
): Promise<{ datos: Buffer; mime: string } | null> {
  const nombre = nombreGenerado(url);
  if (!nombre) return null;

  try {
    const datos = await readFile(path.join(DIRECTORIO, nombre));
    const mime = nombre.endsWith(".jpg") || nombre.endsWith(".jpeg")
      ? "image/jpeg"
      : nombre.endsWith(".webp")
        ? "image/webp"
        : "image/png";
    return { datos, mime };
  } catch {
    return null;
  }
}
