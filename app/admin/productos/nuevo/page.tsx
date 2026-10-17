import type { Metadata } from "next";
import Link from "next/link";

import { FormularioProducto } from "@/components/FormularioProducto";
import { hayAsistente } from "@/lib/asistente";

export const metadata: Metadata = { title: "Crear remera" };

export default function PaginaNuevoProducto() {
  return (
    <div>
      <h2 className="text-xl font-bold">Crear remera</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        Se publica en el catálogo al instante.{" "}
        <Link href="/admin/productos" className="underline">
          Volver a productos
        </Link>
      </p>

      <div className="mt-6">
        <FormularioProducto asistenteDisponible={hayAsistente()} />
      </div>
    </div>
  );
}
