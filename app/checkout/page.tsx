import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  CheckoutCliente,
  type ItemCheckout,
} from "@/components/CheckoutCliente";
import { carritoDeUsuario, itemsDelCarrito, totalCarrito } from "@/lib/carrito";
import { opcionesDeEnvio } from "@/lib/envio";
import { estaConfigurado } from "@/lib/mercadopago";
import { metodoPorDefecto } from "@/lib/mediosDePago";
import { requerirUsuario } from "@/lib/sesion";

export const metadata: Metadata = { title: "Finalizar compra" };

export default async function PaginaCheckout() {
  // Acá sí se exige sesión: un pedido siempre tiene dueño. El invitado que
  // llega hasta acá es porque apretó "Entrar y comprar" en el carrito, que ya
  // lo mandó al login y fusionó su carrito con el de la cuenta.
  const usuario = await requerirUsuario();
  const items = await itemsDelCarrito(carritoDeUsuario(usuario.id));

  if (items.length === 0) redirect("/carrito");

  const subtotal = totalCarrito(items);
  const [opciones, medioGuardado] = await Promise.all([
    opcionesDeEnvio(subtotal),
    metodoPorDefecto(usuario.id),
  ]);

  const itemsParaCliente: ItemCheckout[] = items.map((i) => ({
    id: i.id,
    nombre: i.variant.product.name,
    talle: i.variant.size,
    color: i.variant.color,
    cantidad: i.quantity,
    unitCents: i.variant.product.priceCents,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Finalizar compra
      </h1>

      <ol className="mt-6 flex gap-6 text-xs font-semibold uppercase tracking-wide text-tinta-suave">
        <li className="text-marca-600">1. Carrito</li>
        <li className="text-marca-600">2. Pago</li>
        <li>3. Confirmación</li>
      </ol>

      <div className="mt-8">
        <CheckoutCliente
          items={itemsParaCliente}
          opciones={opciones}
          configurado={estaConfigurado()}
          medioGuardado={
            medioGuardado
              ? { brand: medioGuardado.brand, last4: medioGuardado.last4 }
              : null
          }
          comprador={{ name: usuario.name ?? null, email: usuario.email ?? null }}
        />
      </div>
    </div>
  );
}
