# Pendientes

Lo que quedó abierto. Ordenado por impacto.

Estado: la app está completa y funcionando; la tienda, el carrito, el checkout, el
backoffice y los emails andan. Lo de abajo es lo que falta cerrar.

---

## 1. Saldo de Google — bloquea el asistente de diseño

**Qué pasa.** La cuenta de Google con la que se probó el asistente se quedó sin
crédito prepago. La API responde:

> `402 — Your prepayment credits are depleted`

**Qué hacer.** Cargar saldo en https://ai.studio/projects.

**Qué falta verificar.** El camino "respuesta de la API → guardar imagen →
iterar" no se pudo correr de punta a punta *después* de escribirlo, porque se
corta en el 402. Lo que sí está probado: la llamada a la API (se generaron
cuatro imágenes a mano, y salieron bien) y el parseo, el guardado y la
validación de rutas (34 comprobaciones automáticas).

Con saldo, probar así:

1. Entrar a `/admin/productos/nuevo` como `admin@demo.local`.
2. Botón "Diseñar con el asistente", describir algo (por ejemplo, "un zorro
   pixelado de un juego de plataformas retro") y aceptar la propuesta.
3. Pedir un cambio sobre esa misma imagen ("cambiale el pelaje a naranja").
   Tiene que *ajustar* el diseño, no tirar uno nuevo.
4. Ver que la imagen se ve en la vista previa y, al crear la remera, en la tienda.

---

## 2. Clave de Gemini propia

La clave que está en `.env` (`GOOGLE_API_KEY`) **es la que ya estaba en esta
máquina** (el store de OpenCode, la que usa el agente). Sirve para desarrollo.

Antes de producción: generar una clave propia del proyecto en
https://aistudio.google.com/apikey y reemplazarla.

Ojo con la confusión más probable: `GOOGLE_API_KEY` **no** es
`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`. Aquellas son OAuth, para el login.

---

## 3. Número de WhatsApp real

`components/BotonWhatsApp.tsx` tiene un número de mentira: `5491100000000`. El
botón flotante de la tienda no lleva a ningún lado.

Falta el número real. Ya que estamos, conviene pasarlo a variable de entorno
(`NEXT_PUBLIC_WHATSAPP`): hoy está hardcodeado.

---

## 4. Decidir SSH o HTTPS para GitHub

El push funciona por **HTTPS**, usando `gh` como helper de credenciales
(`gh auth setup-git`, que modificó la configuración global de git).

Hay una clave SSH en `~/.ssh/id_ed25519` que **no está registrada** en GitHub.
Opciones:

- Registrarla (`gh ssh-key add ~/.ssh/id_ed25519.pub`) y volver a SSH.
- Quedar en HTTPS, que ya funciona.

Si la modificación de la config global de git molesta, se revierte.

---

## 5. Credenciales para producción

Nada de esto es código: son cuentas y decisiones.

- **Google OAuth** (login) — redirect URI de producción.
- **GitHub OAuth** (login).
- **MercadoPago** — credenciales de producción (hoy solo hay de prueba).
- **Email** — elegir proveedor y verificar el dominio de `EMAIL_FROM`, si no los
  mails rebotan o caen en spam.
- **`NEXT_PUBLIC_SITE_URL`** con el dominio real.
- **Base de datos** — pasar de SQLite a Postgres.

El paso a paso está en el README, sección "Poner en producción".

---

## 6. Webhook de MercadoPago

Necesita una URL pública; en local no puede llegar a `localhost`. Para probar el
ciclo completo hace falta un túnel (`cloudflared` o `ngrok`) y actualizar
`NEXT_PUBLIC_SITE_URL`.

Igual el pago no se pierde: al volver a `/checkout/resultado` la app le pregunta
a MercadoPago si hay un pago aprobado.

---

## 7. Imágenes del asistente en serverless

Se guardan en `public/productos/generados/`, que es disco local. Sirve para
desarrollo y para un VPS; **en Vercel u otro serverless se pierden en el próximo
deploy**. Si se despliega ahí, reemplazar `lib/asistente/almacen.ts` por un blob
store (S3, Vercel Blob, R2).

---

## 8. Otros (ya documentados en el README)

- El envío es tarifa plana: falta un cotizador real.
- No hay seguimiento automático de envíos.
- La tabla `Session` no se usa (las sesiones son JWT).
- No hay "Más vendidos".
- No hay roles intermedios: solo `USER` y `ADMIN`.
- Quedan 5 vulnerabilidades de npm (severidad alta), del toolchain de
  desarrollo. Sin revisar.

---

## Cómo comprobar que todo sigue sano

```bash
npm run prueba:carrito     # carrito de invitado y fusión al iniciar sesión
npm run prueba:pedidos
npm run prueba:parseo
npm run prueba:mail-envio
npm run prueba:asistente   # parseo y guardado del asistente (no usa red)
npx tsc --noEmit
npx eslint
npm run build
```
