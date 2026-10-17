import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginDemo } from "@/components/LoginDemo";
import { LoginEmail } from "@/components/LoginEmail";
import { entrarConGitHub, entrarConGoogle } from "@/app/actions/auth";
import { hayAccesoPorEmail } from "@/lib/email";
import { rutaInterna } from "@/lib/navegacion";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Entrá o creá tu cuenta" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  // A dónde volver después de entrar. Lo usa el carrito de invitado: si venías
  // de /carrito, querés terminar ahí y no en la home. Se valida para que no sea
  // un redirect a otro sitio.
  const { destino } = await searchParams;
  const aDondeVolver = rutaInterna(destino);

  // Si ya hay sesión, no tiene sentido mostrar el formulario.
  const usuario = await usuarioActual();
  if (usuario) redirect(aDondeVolver);

  // Los proveedores se registran solo si hay credenciales cargadas
  // (ver auth.ts), así que acá se refleja la misma condición.
  const hayGoogle = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  const hayGitHub = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
  );
  const haySSO = hayGoogle || hayGitHub;

  // Misma condición que usa auth.ts para registrar el proveedor de email:
  // en desarrollo siempre, en producción solo con un proveedor real.
  const hayEmail = hayAccesoPorEmail();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Entrá o creá tu cuenta
      </h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Entrá para comprar y seguir tus pedidos. Si todavía no tenés cuenta, se
        crea sola con el primer acceso: no hay que llenar ningún formulario.
      </p>

      {haySSO && (
        <div className="mt-8 space-y-3">
          {hayGoogle && (
            <form action={entrarConGoogle}>
              <input type="hidden" name="destino" value={aDondeVolver} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-borde bg-white px-4 py-3 text-sm font-semibold transition hover:border-tinta"
              >
                <span aria-hidden className="font-bold">
                  G
                </span>
                Continuar con Google
              </button>
            </form>
          )}

          {hayGitHub && (
            <form action={entrarConGitHub}>
              <input type="hidden" name="destino" value={aDondeVolver} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-tinta bg-tinta px-4 py-3 text-sm font-semibold text-white transition hover:bg-tinta/90"
              >
                <span aria-hidden className="font-mono">
                  {"{}"}
                </span>
                Continuar con GitHub
              </button>
            </form>
          )}
        </div>
      )}

      {haySSO && hayEmail && (
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-tinta-suave">
          <span className="h-px flex-1 bg-borde" />
          o
          <span className="h-px flex-1 bg-borde" />
        </div>
      )}

      {hayEmail && <LoginEmail destino={aDondeVolver} />}

      {!haySSO && !hayEmail && (
        <p className="mt-8 rounded-lg bg-humo px-4 py-3 text-sm text-tinta-suave">
          Los accesos con Google y GitHub aparecen acá una vez que cargues las
          credenciales en el archivo <code className="font-mono">.env</code>.
        </p>
      )}

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8">
          <LoginDemo destino={aDondeVolver} />
        </div>
      )}

      <p className="mt-8 text-xs text-tinta-suave">
        Al continuar aceptás nuestros términos y el uso de cookies para mejorar
        tu experiencia de compra.{" "}
        <Link href="/" className="underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
