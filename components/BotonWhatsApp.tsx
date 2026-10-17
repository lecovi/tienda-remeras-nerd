"use client";

import { usePathname } from "next/navigation";

/**
 * Botón flotante de WhatsApp, como en la referencia.
 *
 * No se muestra en el backoffice: del otro lado no hay un cliente, y un botón
 * de "comunicate con nosotros" flotando sobre el panel de administración solo
 * estorba (llega a tapar contenido en pantallas chicas).
 *
 * Es la única razón por la que este componente es de cliente. La alternativa
 * era un grupo de rutas con un layout propio para toda la tienda, que es un
 * refactor grande para un cambio de visibilidad; y un layout no sabe en qué
 * ruta está, así que la decisión no se puede tomar desde `app/layout.tsx`.
 */
export function BotonWhatsApp() {
  const ruta = usePathname();

  if (ruta.startsWith("/admin")) return null;

  return (
    <a
      href="https://wa.me/5491100000000"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-95"
    >
      <span aria-hidden>💬</span>
      <span className="hidden sm:inline">Comunicate por WhatsApp</span>
    </a>
  );
}
