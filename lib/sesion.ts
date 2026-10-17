import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { COOKIE_CARRITO, type DuenoCarrito } from "@/lib/carrito";

export type UsuarioSesion = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
};

/** Devuelve el usuario logueado, o null si no hay sesión. */
export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const sesion = await auth();
  return (sesion?.user as UsuarioSesion | undefined) ?? null;
}

/**
 * Exige sesión. Se usa en páginas y Server Actions: el proxy solo hace un
 * chequeo optimista, la autorización real tiene que pasar por acá.
 */
export async function requerirUsuario(): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

/** Exige rol ADMIN. Es la única puerta de entrada al backoffice. */
export async function requerirAdmin(): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.role !== "ADMIN") redirect("/");
  return usuario;
}

// ---------------------------------------------------------------- Carrito

/**
 * De quién es el carrito que se está por LEER.
 *
 * No crea la cookie si no existe: durante el render de una página no se pueden
 * escribir cookies. Sin cookie de invitado, el carrito simplemente está vacío.
 */
export async function duenoDelCarrito(): Promise<DuenoCarrito | null> {
  const usuario = await usuarioActual();
  if (usuario) return { tipo: "usuario", userId: usuario.id };

  const token = (await cookies()).get(COOKIE_CARRITO)?.value;
  return token ? { tipo: "invitado", cartToken: token } : null;
}

/**
 * De quién es el carrito que se está por MODIFICAR.
 *
 * A diferencia de la versión de lectura, acá sí se crea la cookie de invitado
 * si hace falta. Solo se puede llamar desde una Server Action o un Route
 * Handler, que son los únicos lugares donde escribir cookies está permitido.
 */
export async function duenoDelCarritoParaEscribir(): Promise<DuenoCarrito> {
  const usuario = await usuarioActual();
  if (usuario) return { tipo: "usuario", userId: usuario.id };

  const store = await cookies();
  const existente = store.get(COOKIE_CARRITO)?.value;
  if (existente) return { tipo: "invitado", cartToken: existente };

  const token = randomBytes(24).toString("base64url");

  store.set(COOKIE_CARRITO, token, {
    // El carrito de invitado no puede leerse desde JavaScript: no hay ningún
    // motivo, y así una inyección no puede robar el carrito de nadie.
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Seis meses: es la vida de una cookie de carrito razonable.
    maxAge: 60 * 60 * 24 * 180,
  });

  return { tipo: "invitado", cartToken: token };
}
