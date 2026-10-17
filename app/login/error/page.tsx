import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "No pudimos iniciar sesión" };

/**
 * Página de error de Auth.js.
 *
 * Sin esto, cualquier fallo de login cae en la pantalla por defecto del paquete,
 * que está en inglés y no dice nada útil ("Error Error"). Acá se traduce el
 * código a algo que el cliente pueda entender y, sobre todo, se le da una salida.
 *
 * El caso que más va a aparecer es OAuthAccountNotLinked: alguien se registró
 * con Google y después intentó entrar con GitHub usando el mismo email. Auth.js
 * se niega a unificar esas cuentas por seguridad (si no, quien controle un email
 * en cualquier proveedor podría quedarse con la cuenta), así que lo correcto es
 * explicarle que use el mismo método de la primera vez.
 */

const MENSAJES: Record<string, { titulo: string; detalle: string }> = {
  OAuthAccountNotLinked: {
    titulo: "Ese email ya tiene una cuenta",
    detalle:
      "Tu cuenta se creó con otro método usando este mismo email. Entrá con el que usaste la primera vez: si te registraste con Google, usá Google; si fue con GitHub, usá GitHub.",
  },
  AccessDenied: {
    titulo: "Cancelaste el acceso",
    detalle:
      "No nos diste permiso para usar tu cuenta. Si fue sin querer, probá de nuevo y aceptá el permiso.",
  },
  Verification: {
    titulo: "El link ya no sirve",
    detalle:
      "Ese link de acceso venció o ya se usó. Pedí uno nuevo e intentá otra vez.",
  },
  Configuration: {
    titulo: "El acceso no está bien configurado",
    detalle:
      "Del lado del servidor falta algo de configuración y no es algo que puedas resolver vos. Escribinos por WhatsApp y lo revisamos.",
  },
  OAuthSignin: {
    titulo: "No pudimos conectarnos con el proveedor",
    detalle:
      "Hubo un problema al abrir la pantalla de Google o GitHub. Probá de nuevo en unos segundos.",
  },
  OAuthCallback: {
    titulo: "No pudimos completar el acceso",
    detalle:
      "La respuesta del proveedor no llegó como esperábamos. Probá de nuevo; si sigue pasando, escribinos.",
  },
};

const GENERICO = {
  titulo: "No pudimos iniciar sesión",
  detalle:
    "Algo salió mal y no pudimos completar el acceso. Probá de nuevo; si sigue pasando, escribinos por WhatsApp.",
};

export default async function PaginaErrorAuth({
  searchParams,
}: PageProps<"/login/error">) {
  const { error } = await searchParams;
  // El query param puede llegar repetido (?error=a&error=b), en cuyo caso
  // Next lo entrega como array. Nos quedamos con el primero.
  const codigo = Array.isArray(error) ? error[0] : error;
  const mensaje = (codigo && MENSAJES[codigo]) || GENERICO;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold tracking-tight">{mensaje.titulo}</h1>
      <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
        {mensaje.detalle}
      </p>

      {/* El código crudo ayuda a soporte; al cliente no le dice nada. */}
      {codigo && (
        <p className="mt-6 text-xs text-tinta-suave">
          Si escribís a soporte, mencioná este código:{" "}
          <code className="font-mono">{codigo}</code>
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-marca-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-marca-700"
        >
          Volver a intentar
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-borde px-5 py-3 text-sm font-semibold transition hover:border-tinta"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
