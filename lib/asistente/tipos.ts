/** Tipos del asistente de diseño. Los comparten el proveedor, la acción y la UI. */

import type { Categoria } from "@/lib/constantes";

export type PedidoAsistente = {
  /** Lo que escribió el admin en el chat. */
  pedido: string;
  /** Ruta de la propuesta anterior, cuando se está iterando sobre ella. */
  imagenPrevia?: string;
};

/**
 * Lo que devuelve el asistente. La imagen es lo único garantizado: el nombre,
 * la descripción y la categoría dependen de que el modelo los sepa escribir, y
 * si no los manda, quedan sin definir en vez de inventarse.
 */
export type Propuesta = {
  imagenUrl: string;
  nombre?: string;
  descripcion?: string;
  categoria?: Categoria;
};

export type ProveedorAsistente = {
  nombre: string;
  generar(pedido: PedidoAsistente): Promise<Propuesta>;
};
