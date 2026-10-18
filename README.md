# Nerd Wear — tienda de remeras nerd

Tienda de remeras de cultura pop con catálogo público, login, carrito, checkout
con MercadoPago y backoffice de administración.

El look & feel está inspirado en
[Vara Vara](https://www.varavara.com.ar/productos3/remeras/): barra de anuncio,
grilla de productos con badges de descuento y envío gratis, filtros laterales,
cuotas sin interés y botón de WhatsApp.

Documentos: [`DECISIONES.md`](DECISIONES.md) cuenta por qué está hecho así y qué
caminos se descartaron; [`PENDIENTES.md`](PENDIENTES.md), qué falta.

---

## Puesta en marcha

```bash
npm install
npx prisma migrate dev      # crea la base y aplica las migraciones
npm run db:seed             # carga 13 remeras nerd con 145 variantes
npm run dev
```

Abrir http://localhost:3000

### Comandos útiles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run db:seed` | Recarga el catálogo (no toca usuarios ni pedidos) |
| `npm run db:studio` | Explorador visual de la base |
| `npm run db:reset` | Borra todo y vuelve a sembrar |
| `npm run prueba:carrito` | Pruebas del carrito de invitado y de la fusión al iniciar sesión |
| `npm run prueba:pedidos` | Prueba de integración del flujo carrito → pedido → pago |
| `npm run prueba:parseo` | Pruebas de parseo de precios y slugs |
| `npm run prueba:mail-envio` | Pruebas de la cotización de envío y de las plantillas de mail |
| `npm run admin:promover` | Lista los usuarios; con un email, lo hace admin |

Todas las pruebas se pueden correr juntas: `npm run prueba:carrito && npm run prueba:pedidos && npm run prueba:parseo && npm run prueba:mail-envio`.

---

## Cómo se entra

Hay tres formas, y en las tres **registrarse y entrar son la misma acción**: la
primera vez que alguien se identifica, se crea la cuenta. No hay formulario de
registro aparte ni contraseñas que guardar.

| Forma | Qué necesita | En desarrollo |
| --- | --- | --- |
| **Email con link** | Un proveedor de mail configurado (ver abajo) | Funciona ya: el link se imprime en la consola |
| **Google** | `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` | Apagado hasta que cargues las credenciales |
| **GitHub** | `AUTH_GITHUB_ID` y `AUTH_GITHUB_SECRET` | Apagado hasta que cargues las credenciales |

El acceso por email manda un link que vence en 15 minutos y sirve una sola vez.
En producción solo aparece si hay un proveedor de mail real configurado: si no,
el link se imprimiría en un log que nadie lee y el usuario esperaría un mail que
nunca llega.

Si alguien se registró con Google e intenta entrar con GitHub usando el mismo
email, los dos accesos caen en la **misma cuenta** (Google y GitHub verifican el
email, así que vincularlos es seguro). Las tres vías comparten entonces el
carrito, los pedidos y los medios de pago.

### Perfiles de prueba

Google y GitHub todavía no están configurados, así que hay dos perfiles locales
activos **solo en desarrollo**:

| Perfil | Email | Rol |
| --- | --- | --- |
| Cliente | `cliente@demo.local` | Puede comprar |
| Admin | `admin@demo.local` | Puede comprar y entrar al backoffice |

En `/login` hay dos botones para entrar con cada uno. Este acceso está
desactivado en producción de dos formas independientes (el proveedor no se
registra y el `authorize` devuelve `null`), así que no es un bypass que se pueda
activar por error.

---

## Lo que falta configurar de tu lado

Lo que sigue requiere cuentas, credenciales o decisiones de despliegue que solo
podés tomar vos. Hasta que las cargues, la app funciona pero esas funciones
quedan apagadas.

### 1. Login con Google

1. Entrar a https://console.cloud.google.com/apis/credentials
2. Crear credencial → **ID de cliente de OAuth** → Aplicación web
3. En "URI de redirección autorizados" poner:
   `http://localhost:3000/api/auth/callback/google`
   (y la URL de producción cuando la tengas)
4. Copiar el ID y el secreto a `.env`:

```env
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

### 2. Login con GitHub

1. Entrar a https://github.com/settings/developers → **New OAuth App**
2. **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copiar las credenciales a `.env`:

```env
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
```

Los proveedores se registran solos cuando detectan las credenciales: no hay que
tocar código. Si están vacías, los botones simplemente no aparecen.

### 3. Cobros con MercadoPago

1. Entrar a https://www.mercadopago.com.ar/developers/panel/app
2. Crear una aplicación y copiar las **credenciales de prueba**
3. En la configuración de webhooks, generar la **clave secreta**
4. Cargar en `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
MERCADOPAGO_WEBHOOK_SECRET="..."
```

**Importante sobre el webhook:** MercadoPago necesita una URL pública para
notificar el pago. En local no puede llegar a `localhost`. Para probar el ciclo
completo usá un túnel y actualizá la URL:

```bash
npx cloudflared tunnel --url http://localhost:3000
# o
ngrok http 3000
```

Después poné esa URL en `NEXT_PUBLIC_SITE_URL` y reiniciá. El endpoint es
`/api/mercadopago/webhook`.

Igual, aunque el webhook no llegue, el pago no se pierde: al volver a
`/checkout/resultado` la app le pregunta directamente a MercadoPago si hay un
pago aprobado para ese pedido.

### 4. Emails

Sin configurar nada, los mails **no se envían**: se imprimen en la consola del
servidor con el destinatario y el asunto. Es a propósito, así se puede probar
todo el circuito sin mandarle mails a nadie.

Hay tres proveedores y se elige uno solo. En los tres casos hay que cargar el
remitente:

```env
EMAIL_FROM="Nerd Wear <hola@nerdwear.com.ar>"
```

**Resend** (lo más simple, y el que mejor funciona en serverless):

1. Crear cuenta en https://resend.com
2. Verificar el dominio donde vas a mandar (agregando registros DNS).
3. Crear una API key en https://resend.com/api-keys

```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_..."
```

**SendGrid**: cuenta en https://sendgrid.com, verificar el dominio (Sender
Authentication) y crear la key en https://app.sendgrid.com/settings/api_keys.

```env
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="SG...."
```

**SMTP** (para el correo del hosting, Gmail, Zoho, etc.):

```env
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.tuhosting.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_SECURE="false"   # "true" si el puerto es 465
```

Si dejás `EMAIL_PROVIDER` vacío, se elige solo: Resend, después SendGrid,
después SMTP. Si no hay ninguna credencial, cae en consola.

> **El dominio tiene que estar verificado en el proveedor.** Si mandás desde un
> dominio sin verificar, los mails rebotan o van a spam, aunque el código esté
> perfecto. Es el error más común de esta parte.

Los mails que se mandan hoy:

| Mail | Cuándo sale |
| --- | --- |
| Link de acceso | Cuando alguien pide entrar con su email |
| Bienvenida | Al crear la cuenta con Google, GitHub o el link por email |
| Compra confirmada | Cuando MercadoPago aprueba el pago |
| Pedido enviado | Cuando el backoffice marca el pedido como **Enviado** |
| Carrito abandonado | Lo dispara una tarea programada (ver abajo) |

> **El acceso por email depende de esta configuración.** Hasta que no cargues un
> proveedor, el botón de entrar con email no aparece en producción (en
> desarrollo sí, porque el link se imprime en la consola).

**El envío de mails nunca tumba la operación.** Si el proveedor está caído, el
pago se confirma igual y el error queda en el log. La contra es que el cliente
no recibe el mail y nadie se entera solo; si eso importa, el próximo paso es una
cola con reintentos y un estado "mail pendiente" en el pedido.

### 5. Recordatorio de carrito abandonado

Es la única parte que necesita que algo corra solo. El endpoint es
`/api/tareas/carrito-abandonado` y está protegido con un secreto:

```env
CRON_SECRET="..."   # generar con: openssl rand -base64 32
```

Se llama desde un cron externo mandando `Authorization: Bearer $CRON_SECRET`.
En Vercel alcanza con agregar un `vercel.json`:

```json
{ "crons": [{ "path": "/api/tareas/carrito-abandonado", "schedule": "0 14 * * *" }] }
```

Afuera de Vercel, una línea de crontab cada hora:

```
0 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://tutienda.com.ar/api/tareas/carrito-abandonado
```

Para probarlo a mano:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/tareas/carrito-abandonado
# → {"enviados":0,"revisados":0,"carritosDeInvitadoBorrados":0}
```

Un carrito se considera abandonado si tiene ítems sin tocar por 24 horas. A cada
ítem se le marca `recordatorioEnviadoEn` para no repetir el mail todos los días,
y si el cliente vuelve y modifica el carrito ese campo se limpia: vuelve a ser
candidato si se vuelve a quedar quieto. Sin `CRON_SECRET` el endpoint responde
500 y no manda nada (mejor que dejarlo abierto).

La misma tarea borra los **carritos de invitado** sin tocar por más de 30 días.
Hacen falta porque un invitado no tiene email: el recordatorio no puede
alcanzarlos y, sin esta limpieza, se acumularían para siempre. Los carritos de
usuarios registrados no se tocan nunca desde acá.

---

### 6. Asistente de diseño (backoffice)

En `/admin/productos/nuevo` hay un botón **"Diseñar con el asistente"**: le
describís el estampado, te devuelve la imagen, y podés pedirle cambios sobre esa
misma imagen ("cambiale el sombrero a azul", "agregá la palabra RETRO"). Al
aceptar una propuesta te completa el nombre, la descripción, la categoría y la
imagen.

Usa la API de Gemini, que **se paga por imagen**. La clave es distinta de la del
login:

```env
GOOGLE_API_KEY="..."                          # https://aistudio.google.com/apikey
ASISTENTE_MODELO_IMAGEN="gemini-2.5-flash-image"
```

**Ojo con la confusión más probable:** `GOOGLE_API_KEY` no es
`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`. Aquellas son OAuth, para el login; esta
es la clave de la API de Gemini, que es la que dibuja.

Sin credencial, el botón aparece deshabilitado con la explicación. A diferencia
del email, acá no hay modo simulado a propósito: generar una imagen cuesta, y
simularla daría la falsa sensación de que la función funciona.

Dos cosas a saber:

- **Consume saldo prepago.** Si la cuenta se queda sin crédito, la API responde
  `402` y el diálogo muestra el error. No es un problema del código: hay que
  cargar saldo en AI Studio.
- **`gemini-2.5-flash-image` es rápido y barato; `gemini-3-pro-image` da más
  calidad** y tarda el doble. Se cambia con `ASISTENTE_MODELO_IMAGEN`.

## Cómo funciona el carrito

**Se puede armar el carrito sin cuenta.** El login se pide recién al pagar. Es
donde más se nota: obligar a registrarse antes de la primera remera cuesta ventas,
y del otro lado no aporta nada (un pedido siempre termina teniendo dueño).

Un invitado queda identificado por una cookie `carrito_invitado`: un token
aleatorio, `httpOnly` (JavaScript no lo puede leer) que dura seis meses. No es una
sesión ni da acceso a nada: solo dice "este carrito es de este navegador".

**Al entrar, el carrito te sigue.** En ese momento los ítems del invitado pasan a
la cuenta y la cookie se borra. Si la variante ya estaba en el carrito de la
cuenta, las cantidades se **suman** (topadas por el stock) en lugar de quedar en
dos líneas repetidas. La fusión nunca puede duplicar: si se corriera dos veces, la
segunda no encuentra nada que mover.

Dos cosas más que conviene saber:

- **Un dueño no puede tocar el carrito de otro.** Las operaciones de modificar y
  borrar filtran siempre por dueño, no solo por el id del ítem. Hay una prueba que
  lo cubre.
- **Los carritos de invitado se limpian solos.** Como no tienen email, el
  recordatorio de carrito abandonado no los alcanza (ver la tarea programada).

---

## Cómo se calcula el envío

Hoy es **tarifa plana**: un costo fijo por zona, sin depender de ningún
proveedor. Las opciones que ve el cliente en el checkout son tres:

| Opción | Costo por defecto | Plazo |
| --- | --- | --- |
| Envío a domicilio | `$ 4.500` | 3 a 7 días hábiles |
| Retiro en sucursal | `$ 3.500` | 3 a 7 días hábiles |
| Retiro en el local | Gratis | Listo en 24 h |

Las dos primeras pasan a ser **gratis** desde `$ 75.000` (el umbral está en
`lib/constantes.ts`). Los costos se ajustan sin tocar código:

```env
ENVIO_PROVEEDOR="tarifa-plana"
ENVIO_COSTO_DOMICILIO_CENTS="450000"   # centavos
ENVIO_COSTO_SUCURSAL_CENTS="350000"
```

**Por qué está armado así:** el envío está detrás de una interfaz
(`CotizadorDeEnvio` en `lib/envio.ts`). El día que contrates Andreani o Correo
Argentino, se agrega un cotizador que llame a su API, se lo registra en el mapa
`COTIZADORES` y se elige con `ENVIO_PROVEEDOR`. El checkout, los pedidos y los
mails no cambian una línea, porque todos consumen `OpcionDeEnvio`.

**El precio lo calcula siempre el servidor.** El navegador manda solo el `id` de
la opción (`"domicilio"`); el costo se recalcula al crear el pedido con
`resolverOpcionDeEnvio()`. Si se confiara en el precio que llega del formulario,
cualquiera podría pagar $0 editando el HTML. Hay una prueba que cubre este caso.

El pedido guarda `shippingCents` y `shippingMethod` por separado del total, así
el desglose se puede mostrar y auditar. Si integrás un cotizador real, además
vas a querer pedir el código postal en el checkout: el tipo `ContextoCotizacion`
ya tiene el campo, la tarifa plana simplemente lo ignora.

---

## Poner en producción

### Checklist

1. **Base de datos.** SQLite sirve para probar, no para producción (un archivo
   con escrituras concurrentes se queda corto). Pasá a Postgres: cambiá el
   provider en `prisma/schema.prisma`, el adapter en `lib/prisma.ts` y
   `DATABASE_URL`. Después `npx prisma migrate deploy`.

2. **`AUTH_SECRET`** distinto al de desarrollo y bien guardado:
   `openssl rand -base64 32`. Si se filtra, cualquiera puede firmar sesiones.

3. **Google y GitHub.** Crear las credenciales de producción con la URL real
   como callback (`https://tutienda.com.ar/api/auth/callback/google` y
   `.../github`). Ver la sección de arriba.

4. **MercadoPago en modo producción.** Cambiar las credenciales de prueba
   (`TEST-...`) por las de producción, y cargar el `MERCADOPAGO_WEBHOOK_SECRET`
   que corresponda. Cargar también la URL del webhook en el panel de
   MercadoPago: `https://tutienda.com.ar/api/mercadopago/webhook`.

5. **`NEXT_PUBLIC_SITE_URL`** con la URL pública real. MercadoPago rechaza
   `auto_return` si no la tiene, y sin esto los `back_urls` apuntan a localhost.

6. **Emails.** `EMAIL_FROM` con un dominio verificado y las credenciales del
   proveedor elegido. Mandá un mail de prueba antes de abrir: es lo que más
   fácil sale mal.

7. **`CRON_SECRET`** nuevo, y el cron configurado apuntando a
   `/api/tareas/carrito-abandonado`.

8. **El primer administrador.** Ver la advertencia de abajo: es el paso que se
   olvida y deja la app sin forma de administrarse.

9. **`npx prisma migrate deploy`** al desplegar (no `migrate dev`, que está
   pensado para desarrollo y puede borrar datos).

### La advertencia importante

**El login de prueba está desactivado en producción, a propósito.** Eso significa
que si desplegás **sin** Google, GitHub **ni** un proveedor de mail configurado,
la app queda con **cero** formas de iniciar sesión: nadie puede entrar, ni
siquiera para mirar el backoffice. El catálogo se ve, pero no se puede comprar.

Alcanza con una de las tres para arrancar. Lo más rápido es el proveedor de
mail: configurás Resend, SendGrid o SMTP y ya podés entrar con tu email. Después,
en orden: entrá una vez con tu cuenta real (no el demo) y promovete a admin:

```bash
npm run admin:promover                    # lista los usuarios cargados
npm run admin:promover -- vos@gmail.com   # te da el rol ADMIN
```

La cuenta tiene que existir antes, por eso el primer login va primero. Y el rol
viaja en el token de sesión: **cerrá sesión y volvé a entrar** para que se
aplique.

Para quitarle el rol a alguien: `npm run admin:promover -- vos@gmail.com --quitar`.

---

## Qué está implementado

### Catálogo público

- Home con hero, beneficios, colecciones y lo más nuevo.
- `/catalogo` con grilla, filtros por categoría/talle/color y 6 órdenes reales.
- Los filtros son enlaces: funcionan sin JavaScript. Solo el selector de orden
  usa JS, para no tener que apretar un botón.
- Ficha de producto con selector de talle y color, stock por combinación,
  badges y datos estructurados JSON-LD.
- Los precios se muestran en formato argentino (`$ 29.999,20`).

### Cliente

- Tres formas de entrar: email con link, Google y GitHub. Registrarse y entrar
  son la misma acción.
- Carrito que se puede armar sin cuenta, y que pasa a la cuenta al iniciar
  sesión.
- Carrito persistente por usuario o invitado, con validación de stock.
- `/cuenta/medios-de-pago`: alta, baja y predeterminado de tarjetas.
- `/cuenta/pedidos`: historial con estado de cada pedido.
- Checkout con elección de envío (domicilio, sucursal o retiro) y total en vivo.
- Emails: link de acceso, bienvenida, compra confirmada, pedido enviado y
  recordatorio de carrito abandonado.

### Backoffice (`/admin`)

- Resumen con pedidos pendientes, facturado y alertas de stock.
- `/admin/pedidos`: pedidos por estado, con cambio de estado y código de
  seguimiento. Al pasar a **Enviado** se le avisa al cliente por email.
- `/admin/productos`: listado con stock total, pausar y publicar.
- `/admin/productos/nuevo`: crear remera (genera una variante por cada
  combinación de color y talle, con slug único automático). Incluye el
  asistente de diseño, que completa nombre, descripción, categoría e imagen.
- `/admin/stock`: edición de stock variante por variante.

Está protegido en la capa de datos con `requerirAdmin()`, no en un middleware:
un cliente logueado que escriba `/admin` a mano recibe una redirección.

---

## Decisiones que conviene conocer

**Precios en centavos.** Todo el sistema guarda enteros en centavos y convierte
a pesos solo al mostrar. Evita errores de redondeo en totales.

**Sesiones JWT, no en base de datos.** El proveedor de credenciales de Auth.js
no funciona con sesiones en base. Como el login de prueba y el SSO tienen que
convivir, se usa JWT. El adapter igual persiste usuarios y cuentas OAuth; la
tabla `Session` queda sin uso. El acceso por email sí funciona con JWT (el token
del link se guarda en base vía el adapter), así que no hay conflicto.

**El carrito puede ser de un invitado.** Un `CartItem` pertenece a un usuario o a
un token de cookie, nunca a los dos. La alternativa era crear un usuario
anónimo por visitante, pero eso ensucia la tabla de usuarios (que es la misma que
usa el backoffice y `admin:promover`) y complica cualquier consulta. La
invariante la sostiene `lib/carrito.ts`, que es el único módulo que escribe
carritos; las dos claves únicas son las que evitan líneas duplicadas.

**Las cuentas se vinculan por email entre proveedores.** Si alguien se registró
con Google y entra con GitHub usando el mismo email, cae en la misma cuenta
(`allowDangerousEmailAccountLinking`). El nombre asusta, pero aplica al caso de un
proveedor que no verifique emails: ahí quien controle esa casilla podría entrar a
una cuenta ajena. Google y GitHub sí los verifican. La alternativa era dejarlo
bloqueado, y el usuario quedaba trabado con un error en vez de poder entrar.

**`cacheComponents` desactivado.** El scaffold de Next 16 lo trae activado, pero
con auth + carrito + backoffice obliga a envolver cada lectura de sesión en
`use cache: private`. Se desactivó a propósito en `next.config.ts`.

**El stock se descuenta al pagar, no al agregar al carrito.** Así un carrito
abandonado no bloquea unidades. La contra es que puede haber sobreventa si dos
personas pagan a la vez; al confirmar, el stock se topa en cero y el backoffice
lo ve como faltante. Si querés reservas temporales, hay que agregar un
vencimiento a los ítems del carrito.

**No se guardan datos de tarjeta.** Solo marca, últimos 4 dígitos, vencimiento y
titular. El número completo y el CVV nunca llegan al servidor. Guardar eso
requiere cumplir PCI-DSS, y no corresponde hacerlo en una app propia: el cobro
real lo hace MercadoPago.

**Los mails no pueden tumbar una venta.** `enviar()` nunca lanza: si el
proveedor falla, se registra el error y el pago queda confirmado igual. Es la
prioridad correcta (mejor un mail perdido que una venta perdida), pero implica
que un mail que no sale no genera alarma. Si eso molesta, el siguiente paso es
una cola con reintentos.

**El envío está detrás de una interfaz, no hardcodeado.** Hoy la implementación
es de tarifa plana; el checkout no sabe de dónde sale el precio. Cambiar a un
cotizador real es agregar un archivo, no tocar el flujo de compra.

**El asistente está detrás de una interfaz, igual que el email y el envío.**
`lib/asistente/` expone un proveedor y el resto del sistema no sabe cuál es.
Hoy hay uno solo (Google) y se elige por `ASISTENTE_PROVEEDOR` o por la
credencial presente. La diferencia con el email es que acá no hay proveedor de
consola: cada imagen se paga, así que no existe un modo simulado.

**La iteración es real porque el modelo ve su propia imagen.** Cuando pedís un
cambio, el servidor lee la imagen anterior y la manda como parte de la
conversación. Eso es lo que hace que ajuste el diseño en vez de tirar uno nuevo
desde cero. Como el cliente manda la ruta de esa imagen, el servidor valida que
sea un archivo generado por nosotros antes de leerlo: sin ese chequeo se podría
leer cualquier archivo del servidor.

**Las imágenes generadas van a `public/productos/generados/`.** Sirve para
desarrollo y para un servidor propio. En serverless el disco es de solo lectura
y efímero, así que ahí hay que reemplazar `lib/asistente/almacen.ts` por un blob
store (S3, Vercel Blob, R2). Son dos funciones, y es el único lugar del
asistente que toca el almacenamiento.

**Las imágenes son placeholders.** Se generan con
`npx tsx scripts/generar-imagenes.ts` como SVG en `public/productos/`. Para
poner fotos reales, reemplazá los archivos y actualizá `imageUrl`. En ese
momento conviene migrar de `<img>` a `next/image`.

---

## Limitaciones conocidas

- **El envío es tarifa plana.** No hay integración con Correo Argentino ni
  Andreani, así que el costo no depende del peso, el destino ni la distancia.
  La interfaz para enchufar un cotizador real ya está (ver "Cómo se calcula el
  envío").
- **No hay seguimiento automático.** El código de seguimiento lo carga a mano el
  backoffice; la app no le pregunta a nadie dónde está el paquete.
- **La confirmación de pago depende del webhook o del retorno del cliente.** Si
  el cliente cierra el navegador y el webhook no llega (por ejemplo, sin túnel
  en desarrollo), el pedido queda `PENDING` hasta que alguien mire. En
  producción, con la URL pública cargada, el webhook alcanza.
- **La tabla `Session` no se usa.** Las sesiones son JWT (ver decisiones).
- **No hay "Más vendidos".** La referencia lo tiene; acá no se implementó
  porque exigiría agregar ventas sobre las variantes y hoy daría un resultado
  falso. El resto de los órdenes son reales.
- **La base es SQLite.** Cómoda para desarrollo; para producción conviene
  Postgres (ver "Poner en producción").
- **No hay roles intermedios.** Solo `USER` y `ADMIN`.
- **El asistente de diseño necesita saldo prepago de Google.** Cada imagen se
  cobra. Sin crédito la API devuelve `402` y el diálogo lo muestra.
- **Las imágenes generadas no sobreviven a un deploy en serverless.** Van a
  `public/productos/generados/`, que es disco local (ver "Asistente de diseño").
- **El asistente no sabe leer la marca ni el precio.** Propone el diseño y el
  copy, pero el precio y el stock los sigue cargando una persona.

---

## Estructura

```
app/
  ├─ page.tsx                    Home
  ├─ catalogo/                   Grilla con filtros
  ├─ producto/[slug]/            Ficha de producto
  ├─ carrito/  checkout/         Compra (envío, pago y confirmación)
  ├─ cuenta/                     Pedidos y medios de pago
  ├─ admin/                      Backoffice
  ├─ login/                      Inicio de sesión
  ├─ actions/                    Server Actions (mutaciones)
  └─ api/
      ├─ auth/[...nextauth]/     Auth.js
      ├─ mercadopago/webhook/    Notificación de pagos
      └─ tareas/                 Tareas programadas (cron)
components/                      Interfaz
lib/
  ├─ asistente/                  Asistente de diseño (proveedor, parseo y almacén)
  ├─ carrito.ts                  Carrito (invitado o usuario) y fusión al entrar
  ├─ envio.ts                    Cotización de envío (tarifa plana + interfaz)
  ├─ navegacion.ts               Rutas internas (defensa contra redirect abierto)
  ├─ notificaciones.ts           Todos los mails que manda el sistema
  └─ email/                      Proveedores (consola/SMTP/Resend/SendGrid) y plantillas
prisma/                          Schema, migraciones y seed
scripts/                         Generadores, pruebas y utilidades de admin
```
