import Link from "next/link";

import { usuarioActual, duenoDelCarrito } from "@/lib/sesion";
import { contarUnidades } from "@/lib/carrito";
import { cerrarSesion } from "@/app/actions/auth";

/**
 * Header del sitio. Es un Server Component porque necesita la sesión y el
 * contador del carrito; por eso toda página que lo use se renderiza dinámica.
 */
export async function Header() {
  const [usuario, dueno] = await Promise.all([
    usuarioActual(),
    duenoDelCarrito(),
  ]);
  const unidades = await contarUnidades(dueno);

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* Barra de anuncio */}
      <div className="bg-tinta px-4 py-2 text-center text-xs font-medium tracking-wide text-white">
        ENVÍO GRATIS EN COMPRAS SUPERIORES A $75.000 · 6 CUOTAS SIN INTERÉS ·
        10% OFF PAGANDO POR TRANSFERENCIA
      </div>

      {/* Barra de cuenta */}
      <div className="border-b border-borde">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs">
          <span className="hidden text-tinta-suave sm:block">
            ¡Descuento exclusivo!
          </span>

          <div className="flex items-center gap-3">
            {usuario ? (
              <>
                {usuario.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="font-semibold text-marca-600 hover:underline"
                  >
                    Backoffice
                  </Link>
                )}
                <Link
                  href="/cuenta/pedidos"
                  className="text-tinta-suave hover:text-tinta"
                >
                  Mis pedidos
                </Link>
                <span className="hidden text-tinta-suave sm:inline">
                  Hola, {usuario.name ?? usuario.email}
                </span>
                <form action={cerrarSesion}>
                  <button
                    type="submit"
                    className="text-tinta-suave hover:text-tinta"
                  >
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-tinta-suave hover:text-tinta">
                  Iniciar sesión
                </Link>
                <span className="text-borde">|</span>
                <Link href="/login" className="text-tinta-suave hover:text-tinta">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header principal */}
      <div className="border-b border-borde">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-marca-600 font-mono text-sm font-bold text-white">
              {"</>"}
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Nerd&nbsp;Wear
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium lg:flex">
            <Link href="/catalogo" className="hover:text-marca-600">
              Productos
            </Link>
            <Link href="/catalogo?categoria=Retro" className="hover:text-marca-600">
              Retro
            </Link>
            <Link
              href="/catalogo?categoria=Videogames"
              className="hover:text-marca-600"
            >
              Videogames
            </Link>
            <Link
              href="/catalogo?categoria=C%C3%B3mics%20y%20Anim%C3%A9"
              className="hover:text-marca-600"
            >
              Cómics y Animé
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/carrito"
              className="relative flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-medium hover:border-marca-500"
            >
              <span aria-hidden>🛒</span>
              <span className="hidden sm:inline">Carrito</span>
              {unidades > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-marca-600 px-1 text-xs font-bold text-white">
                  {unidades}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
