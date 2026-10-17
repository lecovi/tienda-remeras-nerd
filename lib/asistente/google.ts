import "server-only";

import { guardarImagen, leerImagen } from "@/lib/asistente/almacen";
import { extraerDatos } from "@/lib/asistente/parseo";
import type {
  PedidoAsistente,
  ProveedorAsistente,
  Propuesta,
} from "@/lib/asistente/tipos";
import { CATEGORIAS } from "@/lib/constantes";

const BASE = (
  process.env.ASISTENTE_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta"
).replace(/\/+$/, "");

const MODELO = process.env.ASISTENTE_MODELO_IMAGEN ?? "gemini-2.5-flash-image";

const INSTRUCCION = `Sos disenador de estampados para una tienda argentina de remeras de cultura pop.
Generás la imagen del estampado que pide el usuario: un diseño plano, centrado, con bordes
limpios y fondo liso, sin texto salvo que lo pidan explícitamente.

Además devolvés un JSON con exactamente estas claves:
{"nombre": "...", "descripcion": "...", "categoria": "..."}
- nombre: hasta 60 caracteres.
- descripcion: 2 o 3 frases en castellano rioplatense, con voseo.
- categoria: una sola, elegida de esta lista: ${CATEGORIAS.join(", ")}.`;

type ParteRespuesta = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
};

type RespuestaGemini = {
  candidates?: { content?: { parts?: ParteRespuesta[] } }[];
};

async function pedirAGemini(contents: unknown[]): Promise<ParteRespuesta[]> {
  const respuesta = await fetch(`${BASE}/models/${MODELO}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GOOGLE_API_KEY ?? "",
    },
    body: JSON.stringify({
      contents,
      // TEXT además de IMAGE: en la misma llamada viene el diseño y el copy.
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(`Gemini respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
  }

  const datos = (await respuesta.json()) as RespuestaGemini;
  return datos.candidates?.[0]?.content?.parts ?? [];
}

export function crearProveedorGoogle(): ProveedorAsistente | null {
  if (!process.env.GOOGLE_API_KEY) return null;

  return {
    nombre: "google",

    async generar({ pedido, imagenPrevia }: PedidoAsistente): Promise<Propuesta> {
      const contents: unknown[] = [];

      // Con imagen previa, la conversación va en tres turnos: la instrucción,
      // la imagen que devolvió el modelo y el ajuste pedido. Que el modelo vea
      // su propia imagen es lo que hace que EDITE el diseño en vez de tirar
      // uno nuevo desde cero, que es la diferencia entre iterar y sortear.
      const anterior = imagenPrevia ? await leerImagen(imagenPrevia) : null;

      if (anterior) {
        contents.push({ role: "user", parts: [{ text: INSTRUCCION }] });
        contents.push({
          role: "model",
          parts: [
            {
              inlineData: {
                mimeType: anterior.mime,
                data: anterior.datos.toString("base64"),
              },
            },
          ],
        });
        contents.push({
          role: "user",
          parts: [
            {
              text: `Ajustá el diseño así: ${pedido}\n\nDevolvé también el JSON actualizado.`,
            },
          ],
        });
      } else {
        contents.push({
          role: "user",
          parts: [{ text: `${INSTRUCCION}\n\nPedido: ${pedido}` }],
        });
      }

      const partes = await pedirAGemini(contents);

      let base64: string | undefined;
      let mime = "image/png";
      let texto = "";

      for (const parte of partes) {
        if (parte.inlineData?.data) {
          base64 = parte.inlineData.data;
          mime = parte.inlineData.mimeType ?? mime;
        }
        if (parte.text) texto += parte.text;
      }

      if (!base64) {
        throw new Error("El modelo no devolvió ninguna imagen.");
      }

      const imagenUrl = await guardarImagen(Buffer.from(base64, "base64"), mime);
      return { imagenUrl, ...extraerDatos(texto) };
    },
  };
}
