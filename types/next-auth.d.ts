import type { DefaultSession } from "next-auth";

// Auth.js no tipa `id` ni `role` en la sesión. Se declaran acá para que
// session.user.id y session.user.role sean válidos en todo el proyecto.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
