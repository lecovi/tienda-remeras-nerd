import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { estaConfigurado, pagos } from "@/lib/mercadopago";
import { formatearPrecio } from "@/lib/formato";
import { notificarCompraConfirmada } from "@/lib/notificaciones";
import { confirmarPago, obtenerPedidoDelUsuario } from "@/lib/pedidos";
import { requerirUsuario } from "@/lib/sesion";

export const metadata: Metadata = { title: "Resultado del pago" };

export default async function PaginaResultado({
  searchParams,
}: PageProps<"/checkout/resultado">) {
  const { pedido: pedidoId } = await searchParams;
  const usuario = await requerirUsuario();

  if (typeof pedidoId !== "string" || !pedidoId) notFound();

  // El filtro por usuario es lo que impide que alguien abra el pedido ajeno
  // cambiando el id en la URL.
  let pedido = await obtenerPedidoDelUsuario(pedidoId, usuario.id);
  if (!pedido) notFound();

  /**
   * Reconciliación al volver de MercadoPago.
   *
   * En desarrollo el webhook no puede llegar a localhost, y en producción
   * puede demorar. Por eso, si el pedido sigue pendiente, se le pregunta
   * directamente a MercadoPago si hay un pago aprobado para este pedido.
   * Se consulta con NUESTRO access token, así que la respuesta es confiable.
   */
  if (pedido.status === "PENDING" && estaConfigurado()) {
    try {
      const busqueda = await pagos().search({
        options: {
          external_reference: pedido.id,
          sort: "date_created",
          criteria: "desc",
        },
      });

      const aprobado = busqueda.results?.find((p) => p.status === "approved");

      if (aprobado) {
        const resultado = await confirmarPago(pedido.id, aprobado.id);

        // El mail de confirmación sale una sola vez, y solo si esta visita
        // fue la que registró el pago. Si ya estaba pago, el cliente lo
        // recibió antes (o lo va a mandar el webhook).
        if (!resultado.yaEstaba) {
          const idPedido = pedido.id;
          after(() => notificarCompraConfirmada(idPedido));
        }

        pedido = await obtenerPedidoDelUsuario(pedido.id, usuario.id);
      }
    } catch (error) {
      // Que falle la verificación no debe romper la página: el webhook
      // igual va a confirmar el pago cuando llegue.
      console.error("[resultado] no se pudo verificar el pago:", error);
    }
  }

  const pagado = pedido?.status === "PAID";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div
        className={`rounded-2xl border p-8 text-center ${
          pagado
            ? "border-exito/30 bg-exito/5"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        <p className="text-4xl" aria-hidden>
          {pagado ? "✅" : "⏳"}
        </p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
          {pagado ? "¡Pago confirmado!" : "Pago pendiente de confirmación"}
        </h1>
        <p className="mt-3 text-sm text-tinta-suave">
          {pagado
            ? "Ya estamos preparando tu pedido. Te enviamos el detalle por email."
            : "MercadoPago todavía no nos confirmó el pago. Apenas lo haga, el pedido se actualiza automáticamente."}
        </p>

        {pedido && (
          <p className="mt-5 font-mono text-xs text-tinta-suave">
            Pedido #{pedido.id.slice(-8).toUpperCase()} ·{" "}
            {formatearPrecio(pedido.totalCents)}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/cuenta/pedidos"
            className="rounded-lg bg-marca-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-marca-700"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/catalogo"
            className="rounded-lg border border-borde px-5 py-2.5 text-sm font-bold hover:border-tinta"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
