import Link from "next/link";

import { CATEGORIAS } from "@/lib/constantes";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-borde bg-humo">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca-600 font-mono text-xs font-bold text-white">
              {"</>"}
            </span>
            <span className="font-extrabold tracking-tight">Nerd Wear</span>
          </div>
          <p className="mt-3 text-sm text-tinta-suave">
            Remeras de cultura pop, retro y videojuegos. Estampas duraderas,
            algodón de calidad y envíos a todo el país.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">Comprar</h3>
          <ul className="mt-3 space-y-2 text-sm text-tinta-suave">
            <li>
              <Link href="/catalogo" className="hover:text-marca-600">
                Ver todo
              </Link>
            </li>
            {CATEGORIAS.slice(0, 4).map((c) => (
              <li key={c}>
                <Link
                  href={`/catalogo?categoria=${encodeURIComponent(c)}`}
                  className="hover:text-marca-600"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">Ayuda</h3>
          <ul className="mt-3 space-y-2 text-sm text-tinta-suave">
            <li>Tabla de talles</li>
            <li>Envíos y devoluciones</li>
            <li>Preguntas frecuentes</li>
            <li>Medios de pago</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">
            Contacto
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-tinta-suave">
            <li>hola@nerdwear.com.ar</li>
            <li>Lunes a viernes de 9 a 18 h</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-borde px-4 py-6 text-center text-xs text-tinta-suave">
        © {new Date().getFullYear()} Nerd Wear · Sitio de demostración
      </div>
    </footer>
  );
}
