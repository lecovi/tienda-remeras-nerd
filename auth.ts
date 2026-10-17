import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import type { EmailConfig } from "next-auth/providers/email";

import { COOKIE_CARRITO, fusionarCarritoDeInvitado } from "@/lib/carrito";
import { enviar, hayAccesoPorEmail } from "@/lib/email";
import { plantillaAcceso } from "@/lib/email/plantillas";
import { notificarBienvenida } from "@/lib/notificaciones";
import { prisma } from "@/lib/prisma";

/**
 * Google y GitHub verifican el email de la cuenta, así que vincular
 * automáticamente es seguro en la práctica: si alguien se registró con Google y
 * después entra con GitHub usando el mismo email, cae en la MISMA cuenta.
 *
 * Sin esto, Auth.js tira OAuthAccountNotLinked y el usuario queda trabado
 * (tiene una página que se lo explica, pero igual es una fricción que se evita).
 *
 * El nombre que Auth.js le dio a esta opción ("dangerous") es por el caso
 * teórico de un proveedor que NO verifique emails: ahí, quien controle esa
 * casilla podría entrar a una cuenta ajena. Con Google y GitHub no aplica.
 */
const vincularPorEmail = { allowDangerousEmailAccountLinking: true } as const;

/**
 * Los proveedores de SSO se registran solo si sus credenciales están cargadas.
 * Si se registraran con valores vacíos, Auth.js fallaría al arrancar y no se
 * podría usar la tienda ni siquiera con el login demo.
 */
const proveedores: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  proveedores.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      ...vincularPorEmail,
    }),
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  proveedores.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      ...vincularPorEmail,
    }),
  );
}

/**
 * Acceso por email con link (link mágico): el usuario escribe su email, le
 * llega un link y con eso entra. No hay contraseña que guardar ni que filtrar.
 *
 * Está declarado a mano en lugar de usar el proveedor `Nodemailer` de Auth.js
 * por una razón concreta: ese proveedor exige una configuración SMTP y falla al
 * arrancar si no está, aunque le pases tu propia función de envío. No tiene
 * sentido, porque el envío lo hace nuestra capa de emails (lib/email), que ya
 * soporta Resend, SendGrid y SMTP y elige sola según las credenciales.
 *
 * OJO: `enviar()` no lanza nunca. Si el proveedor de correo falla, el error
 * queda en el log y el usuario igual ve "te mandamos un link". Es la misma
 * decisión que en el resto de los mails (ver README); la contra es que un envío
 * caído no genera alarma sola.
 */
const proveedorEmail: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  from: process.env.EMAIL_FROM ?? "Nerd Wear <no-reply@nerdwear.com.ar>",
  // Un link de acceso que entra a una cuenta no tiene por qué durar un día.
  // Auth.js lo interpreta en SEGUNDOS.
  maxAge: 15 * 60,
  async sendVerificationRequest({ identifier, url, expires }) {
    const { asunto, html, texto } = plantillaAcceso(url, expires);
    await enviar({ para: identifier, asunto, html, texto });
  },
};

// Igual que el login demo: en producción solo si hay un proveedor de correo
// real configurado. Si no, el link se imprimiría en un log que nadie lee y el
// usuario esperaría un mail que nunca llega.
if (hayAccesoPorEmail()) {
  proveedores.push(proveedorEmail);
}

/**
 * Acceso de prueba, SOLO en desarrollo.
 *
 * Existe porque el SSO real necesita credenciales de Google/GitHub que hay que
 * tramitar aparte, y sin esto no se podría probar el carrito, los pedidos ni el
 * backoffice. En producción devuelve null siempre: no es un bypass activable.
 */
if (process.env.NODE_ENV !== "production") {
  proveedores.push(
    Credentials({
      id: "demo",
      name: "Demo local",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(creds) {
        // Defensa en profundidad: aunque el proveedor no se registre en
        // producción, la comprobación queda también acá.
        if (process.env.NODE_ENV === "production") return null;

        const email = typeof creds?.email === "string" ? creds.email : null;
        if (!email) return null;

        // Los dos usuarios demo son fijos; el rol admin habilita el backoffice.
        const esAdmin = email === "admin@demo.local";
        if (!esAdmin && email !== "cliente@demo.local") return null;

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: esAdmin ? "Admin Demo" : "Cliente Demo",
            role: esAdmin ? "ADMIN" : "USER",
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  /**
   * Estrategia JWT y no "database" por una limitación de Auth.js: el proveedor
   * de credenciales (el login demo) no funciona con sesiones en base de datos.
   * El adapter sigue persistiendo usuarios y cuentas OAuth; la tabla Session
   * queda sin uso.
   *
   * El proveedor de email sí funciona con JWT (el token de verificación se
   * guarda en la base vía el adapter), así que no hay conflicto.
   */
  session: { strategy: "jwt" },

  providers: proveedores,

  pages: {
    signIn: "/login",
    error: "/login/error",
    // Sin esto, después de pedir el link el usuario cae en una página de
    // Auth.js en inglés. El flujo redirige acá con el mail ya enviado.
    verifyRequest: "/login/verificar",
  },

  callbacks: {
    // El id y el rol no viajan por defecto en el token: hay que copiarlos
    // para poder resolver permisos sin pegarle a la base en cada request.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },

  events: {
    /**
     * Mail de bienvenida al crear la cuenta.
     *
     * Se dispara con el alta a través del adapter: o sea con Google, GitHub y
     * el link por email. El login demo hace un upsert directo contra la base,
     * así que no pasa por acá y no manda bienvenida (son cuentas de prueba).
     */
    async createUser({ user }) {
      if (user.id) await notificarBienvenida(user.id);
    },

    /**
     * Al entrar, el carrito que se armó sin cuenta viaja con el usuario.
     *
     * Es el momento correcto: es cuando el invitado pasa a ser alguien. Si el
     * carrito de invitado no tuviera nada, esto no hace nada.
     *
     * Todo va en try/catch y no se propaga el error a propósito: que falle
     * fusionar un carrito no puede impedir que alguien entre a su cuenta. Como
     * mucho pierde lo que tenía en el carrito de invitado.
     *
     * Borrar la cookie es best-effort: si el framework no lo permite desde acá,
     * la fusión igual quedó hecha (los ítems ya cambiaron de dueño) y la cookie
     * queda apuntando a un carrito vacío. Volver a fusionar no duplica nada.
     */
    async signIn({ user }) {
      if (!user.id) return;

      try {
        const store = await cookies();
        const token = store.get(COOKIE_CARRITO)?.value;
        if (!token) return;

        const movidos = await fusionarCarritoDeInvitado(token, user.id);

        if (movidos > 0) {
          store.delete(COOKIE_CARRITO);
        }
      } catch (error) {
        console.error(
          "[auth] no se pudo fusionar el carrito de invitado:",
          error,
        );
      }
    },
  },
});
