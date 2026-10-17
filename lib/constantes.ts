/** Valores compartidos entre el catálogo público, los formularios y el backoffice. */

export const CATEGORIAS = [
  "Retro",
  "Los Simpson",
  "Dibujos animados",
  "Cine y series",
  "Memes",
  "Videogames",
  "Cómics y Animé",
  "Literatura y Juguetes",
  "Varios",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const TALLES = ["S", "M", "L", "XL", "XXL"] as const;
export type Talle = (typeof TALLES)[number];

export const COLORES = ["Negro", "Blanco", "Marino", "Rojo"] as const;
export type Color = (typeof COLORES)[number];

export const ORDENES = {
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  "nombre-asc": "A - Z",
  "nombre-desc": "Z - A",
  recientes: "Más nuevo al más viejo",
  antiguos: "Más viejo al más nuevo",
} as const;

export type Orden = keyof typeof ORDENES;

export const ESTADOS_PEDIDO = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  CANCELLED: "Cancelado",
} as const;

export type EstadoPedido = keyof typeof ESTADOS_PEDIDO;

/** Estados que el backoffice considera "pendientes de resolver". */
export const ESTADOS_PENDIENTES: EstadoPedido[] = ["PENDING", "PAID"];

/** Envío gratis desde $75.000 (en centavos, como todos los precios). */
export const UMBRAL_ENVIO_GRATIS_CENTS = 7_500_000;

/** Descuento por transferencia bancaria. */
export const DESCUENTO_TRANSFERENCIA = 0.1;
