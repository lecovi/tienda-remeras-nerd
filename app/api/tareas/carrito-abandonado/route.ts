import { timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { limpiarCarritosDeInvitadoViejos } from "@/lib/carrito";
import { notificarCarritosAbandonados } from "@/lib/notificaciones";

/**
 * Tarea programada: recordatorio de carrito abandonado.
 *
 * Se invoca desde un cron externo. En Vercel, agregando un `vercel.json`:
 *
 *   { "crons": [{ "path": "/api/tareas/carrito-abandonado", "schedule": "0 14 * * *" }] }
 *
 * Vercel manda `Authorization: Bearer $CRON_SECRET` automáticamente si la
 * variable existe. En cualquier otro hosting, el cron tiene que mandar el
 * mismo header.
 *
 * Sin CRON_SECRET el endpoint queda cerrado: es preferible que no funcione a
 * dejar un endpoint público que mande mails a todos los usuarios.
 */

function firmaValida(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;

  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);

  // timingSafeEqual exige igual longitud, y comparar longitudes primero no
  // filtra información útil (la longitud del secreto no es secreta).
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;

  if (!secreto) {
    console.error("[cron] falta CRON_SECRET: la tarea queda deshabilitada.");
    return NextResponse.json(
      { error: "Tarea no configurada" },
      { status: 500 },
    );
  }

  if (!firmaValida(request.headers.get("authorization"), `Bearer ${secreto}`)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const resultado = await notificarCarritosAbandonados(24);

    // Los carritos de invitado no tienen email, así que el recordatorio los
    // ignora y se acumularían para siempre. Se limpian acá, aprovechando que
    // esta tarea ya corre todos los días.
    const limpiados = await limpiarCarritosDeInvitadoViejos(30);

    console.log(
      `[cron] carritos abandonados: ${resultado.enviados} mails de ${resultado.revisados} carritos revisados`,
    );
    console.log(
      `[cron] carritos de invitado viejos borrados: ${limpiados}`,
    );

    return NextResponse.json({ ...resultado, carritosDeInvitadoBorrados: limpiados });
  } catch (error) {
    console.error("[cron] falló el envío de recordatorios:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
