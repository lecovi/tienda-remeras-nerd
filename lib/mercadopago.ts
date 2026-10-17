import "server-only";

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

/**
 * Cliente de MercadoPago.
 *
 * Sin MERCADOPAGO_ACCESS_TOKEN el SDK no se instancia: la app tiene que poder
 * correr y mostrar el checkout aunque las credenciales todavía no estén.
 */
export function estaConfigurado(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

let cache: MercadoPagoConfig | null = null;

function cliente(): MercadoPagoConfig {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN");
  }
  // Se reutiliza la instancia: el SDK mantiene conexiones HTTP.
  cache ??= new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 10_000 },
  });
  return cache;
}

export function preferences() {
  return new Preference(cliente());
}

export function pagos() {
  return new Payment(cliente());
}

/** URL pública del sitio, necesaria para las back_urls absolutas de MercadoPago. */
export function urlDelSitio(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
