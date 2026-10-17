/**
 * Contrato de envío de emails.
 *
 * La idea es que el resto de la app nunca sepa qué proveedor está detrás.
 * Enviar un mail es siempre `enviar({ para, asunto, html })`.
 */

export type Mensaje = {
  para: string;
  asunto: string;
  html: string;
  /** Alternativa en texto plano. Mejora la entregabilidad y cubre clientes que no renderizan HTML. */
  texto?: string;
};

export interface ProveedorDeEmail {
  /** Nombre para logs. */
  readonly nombre: string;
  enviar(mensaje: Mensaje): Promise<void>;
}
