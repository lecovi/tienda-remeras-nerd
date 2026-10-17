"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { CATEGORIAS, COLORES, ESTADOS_PEDIDO, TALLES } from "@/lib/constantes";
import { notificarPedidoEnviado } from "@/lib/notificaciones";
import { aCentavos, aSlug } from "@/lib/parseo";
import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/sesion";

export type EstadoAdmin = {
  error?: string;
  ok?: string;
  errores?: Record<string, string[]>;
};

const esquemaProducto = z.object({
  name: z.string().trim().min(3, "El nombre necesita al menos 3 caracteres.").max(80),
  description: z.string().trim().min(10, "Contá algo del diseño (mínimo 10 caracteres).").max(600),
  categoria: z.enum(CATEGORIAS, "Elegí una categoría."),
  imageUrl: z.string().trim().min(1, "Indicá la ruta o URL de la imagen."),
  colores: z
    .array(z.enum(COLORES))
    .min(1, "Elegí al menos un color."),
  stockPorTalle: z.record(z.string(), z.coerce.number().int().min(0, "El stock no puede ser negativo.")),
});

export async function crearProducto(
  _estado: EstadoAdmin,
  formData: FormData,
): Promise<EstadoAdmin> {
  await requerirAdmin();

  const precioCentavos = aCentavos(formData.get("price"));
  const listaCentavos = aCentavos(formData.get("listPrice"));

  if (precioCentavos === null || precioCentavos <= 0) {
    return { errores: { price: ["Ingresá un precio válido."] } };
  }
  if (listaCentavos !== null && listaCentavos <= precioCentavos) {
    return {
      errores: {
        listPrice: ["El precio de lista tiene que ser mayor al de venta."],
      },
    };
  }

  const stockPorTalle: Record<string, number> = {};
  for (const talle of TALLES) {
    const valor = formData.get(`stock_${talle}`);
    stockPorTalle[talle] = valor ? Number(valor) : 0;
  }

  const resultado = esquemaProducto.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoria: formData.get("category"),
    imageUrl: formData.get("imageUrl"),
    colores: formData.getAll("colores"),
    stockPorTalle,
  });

  if (!resultado.success) {
    return { errores: resultado.error.flatten().fieldErrors };
  }

  const datos = resultado.data;

  // El slug tiene que ser único; si ya existe se le agrega un sufijo numérico.
  const base = aSlug(datos.name) || "remera";
  let slug = base;
  let intento = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${intento++}`;
  }

  await prisma.product.create({
    data: {
      name: datos.name,
      slug,
      description: datos.description,
      priceCents: precioCentavos,
      listCents: listaCentavos,
      imageUrl: datos.imageUrl,
      category: datos.categoria,
      freeShipping: formData.get("freeShipping") === "on",
      variants: {
        create: datos.colores.flatMap((color) =>
          TALLES.map((talle) => ({
            size: talle,
            color,
            stock: datos.stockPorTalle[talle] ?? 0,
            sku: `${slug.slice(0, 8).toUpperCase()}-${talle}-${color.slice(0, 3).toUpperCase()}`,
          })),
        ),
      },
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");

  return { ok: `“${datos.name}” se creó con ${datos.colores.length * TALLES.length} variantes.` };
}

export async function actualizarStock(formData: FormData): Promise<void> {
  await requerirAdmin();

  const variantId = formData.get("variantId");
  const stock = Number(formData.get("stock"));

  // El input ya es numérico con min=0; esto es la defensa del lado servidor.
  if (typeof variantId !== "string" || !variantId) return;
  if (!Number.isInteger(stock) || stock < 0) return;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/catalogo");
}

export async function cambiarEstadoPedido(formData: FormData): Promise<void> {
  await requerirAdmin();

  const orderId = formData.get("orderId");
  const estado = formData.get("estado");
  const seguimiento = formData.get("trackingCode");

  if (typeof orderId !== "string" || !orderId) return;
  if (
    typeof estado !== "string" ||
    !Object.keys(ESTADOS_PEDIDO).includes(estado)
  ) {
    return;
  }

  // Se lee el estado previo para saber si el pedido está PASANDO a enviado.
  const anterior = await prisma.order.findUnique({ where: { id: orderId } });
  if (!anterior) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: estado,
      ...(typeof seguimiento === "string" && seguimiento.trim()
        ? { trackingCode: seguimiento.trim() }
        : {}),
    },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/cuenta/pedidos");

  // El aviso "salió tu pedido" se manda solo cuando el pedido PASA a enviado.
  // Si ya estaba en SHIPPED y el admin únicamente corrige el seguimiento, no
  // se le vuelve a mandar el mismo mail al cliente.
  if (estado === "SHIPPED" && anterior.status !== "SHIPPED") {
    after(() => notificarPedidoEnviado(orderId));
  }
}

export async function alternarActivoProducto(formData: FormData): Promise<void> {
  await requerirAdmin();

  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) return;

  const producto = await prisma.product.findUnique({ where: { id: productId } });
  if (!producto) return;

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: !producto.isActive },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
}
