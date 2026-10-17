/*
  Advertencia original: se agregó la columna obligatoria `actualizadoEn` a la
  tabla `CartItem`, que no está vacía.

  Resolución: se reconstruye la tabla y se hace backfill tomando `createdAt`.
  Es la mejor aproximación disponible, y para un ítem de carrito es además
  correcta: hasta este momento no había otra señal de última modificación.
  Así los carritos existentes no se consideran abandonados de inmediato.
*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CartItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "recordatorioEnviadoEn" DATETIME,
    CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CartItem" ("createdAt", "id", "quantity", "recordatorioEnviadoEn", "userId", "variantId", "actualizadoEn") SELECT "createdAt", "id", "quantity", "recordatorioEnviadoEn", "userId", "variantId", "createdAt" FROM "CartItem";
DROP TABLE "CartItem";
ALTER TABLE "new_CartItem" RENAME TO "CartItem";
CREATE UNIQUE INDEX "CartItem_userId_variantId_key" ON "CartItem"("userId", "variantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
