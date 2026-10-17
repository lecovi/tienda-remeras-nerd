"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { rutaInterna } from "@/lib/navegacion";

export type EstadoLogin = { error?: string } | undefined;

/**
 * Auth.js señala los fallos de credenciales con AuthError, pero el redirect
 * posterior al login viaja como un error especial de Next que TIENE que
 * propagarse. Si se atrapa sin distinguir, la pantalla se queda colgada.
 */
function traducirError(error: unknown): string {
  if (error instanceof AuthError) {
    return "No pudimos iniciar sesión. Revisá los datos e intentá de nuevo.";
  }
  throw error;
}

function destinoDe(formData: FormData): string {
  return rutaInterna(formData.get("destino"));
}

export async function entrarConGoogle(formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: destinoDe(formData) });
}

export async function entrarConGitHub(formData: FormData): Promise<void> {
  await signIn("github", { redirectTo: destinoDe(formData) });
}

/**
 * Acceso por email con link. El redirect posterior viaja como error especial de
 * Next, igual que en el login demo, así que se traduce igual.
 */
export async function entrarConEmail(
  _estado: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Escribí tu email para mandarte el link." };
  }

  try {
    // Si sale bien, esto no vuelve: redirige a la página de "revisá tu correo".
    await signIn("email", {
      email: email.trim(),
      redirectTo: destinoDe(formData),
    });
  } catch (error) {
    return { error: traducirError(error) };
  }
}

/** Login de prueba, solo disponible en desarrollo (ver auth.ts). */
export async function entrarConDemo(
  _estado: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return { error: "Elegí un perfil de prueba." };
  }

  try {
    await signIn("demo", {
      email,
      redirectTo: destinoDe(formData),
    });
  } catch (error) {
    return { error: traducirError(error) };
  }
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/" });
}
