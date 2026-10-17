import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desactivado a propósito: con auth + carrito + backoffice, Cache Components
  // exige envolver cada lectura de sesión en `use cache: private` o `instant = false`.
  // Con estas features el modelo dynamic clásico es más simple y predecible.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
