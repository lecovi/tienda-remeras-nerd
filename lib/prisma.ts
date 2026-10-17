import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

// En Prisma 7 el acceso a la base pasa por un driver adapter.
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});

// En desarrollo Next.js recarga los módulos en cada cambio; sin este cache
// se crea un PrismaClient (y un pool de conexiones) nuevo por cada recarga.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
