/**
 * Da (o quita) permisos de administrador a un usuario.
 *
 * En producción esto es imprescindible: el login demo está apagado, así que la
 * primera cuenta que entra es un usuario común y no hay forma de llegar al
 * backoffice desde la interfaz. Se corre una vez y listo.
 *
 * Uso:
 *   npm run admin:promover                 → lista los usuarios cargados
 *   npm run admin:promover -- hola@x.com   → lo hace admin
 *   npm run admin:promover -- hola@x.com --quitar
 *
 * Ojo con el `--`: es lo que separa los argumentos de npm de los del script.
 */
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

/** Devuelve el código de salida. */
async function main(): Promise<number> {
  const [email, ...banderas] = process.argv.slice(2);
  const quitar = banderas.includes("--quitar");

  // Sin email: listar. Es la forma de averiguar qué cuentas existen, que es
  // justo lo que hace falta después del primer login.
  if (!email) {
    const usuarios = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { email: true, name: true, role: true },
    });

    if (usuarios.length === 0) {
      console.log("No hay usuarios todavía.");
      console.log(
        "Entrá a la tienda con Google o GitHub una vez y volvé a correr esto.",
      );
      return 0;
    }

    console.log("Usuarios cargados:\n");
    for (const u of usuarios) {
      const marca = u.role === "ADMIN" ? " [ADMIN]" : "";
      console.log(`  ${u.email}${marca}${u.name ? ` — ${u.name}` : ""}`);
    }
    console.log("\nPara hacer admin a uno:");
    console.log(`  npm run admin:promover -- ${usuarios[0].email}`);
    return 0;
  }

  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario) {
    console.error(`No existe ningún usuario con el email "${email}".`);
    console.error("");
    console.error(
      "La cuenta se crea al iniciar sesión con Google o GitHub. Iniciá sesión",
    );
    console.error("una vez y volvé a correr este comando.");
    return 1;
  }

  const rol = quitar ? "USER" : "ADMIN";
  await prisma.user.update({ where: { id: usuario.id }, data: { role: rol } });

  console.log(
    quitar
      ? `Listo: ${email} ya no es administrador.`
      : `Listo: ${email} ahora es administrador.`,
  );
  if (!quitar) {
    console.log(
      "Cerrá sesión y volvé a entrar para que el rol se refleje en la sesión.",
    );
  }
  return 0;
}

main()
  .then(async (codigo) => {
    await prisma.$disconnect();
    process.exit(codigo);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
