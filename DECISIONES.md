# Decisiones y recorrido

El proyecto tiene tres documentos, y cada uno responde una pregunta distinta:

| Archivo | Responde |
| --- | --- |
| [`README.md`](README.md) | cómo funciona y cómo ponerlo en marcha |
| [`PENDIENTES.md`](PENDIENTES.md) | qué falta hacer |
| `DECISIONES.md` | **por qué está hecho así** — incluidos los caminos descartados |

El README resume las decisiones finales. Acá está el **recorrido**: qué se probó,
qué falló, con qué evidencia y qué se aprendió. La idea es que nadie —persona o
agente— repita una investigación ya hecha.

---

## 1. Lo que se pidió

> "Un chat donde describo qué imagen quiero en la remera y el modelo me devuelve
> la imagen y yo la visualizo en la tienda."

Además de la imagen, la propuesta trae **nombre, descripción y categoría**, para
que aceptar una idea deje el formulario de alta casi completo.

Y algo que no estaba en la frase pero era la parte difícil: **poder iterar**.
"Está bien, pero cambiale el color" tiene que ajustar *esa* imagen, no tirar una
nueva desde cero.

---

## 2. Lo que se descartó (la parte útil)

### 2.1 Un modelo local

La máquina tenía un endpoint compatible con OpenAI en
`http://127.0.0.1:11434/v1` (Ollama) y tres modelos:

| Modelo | Tamaño |
| --- | --- |
| `tinyllama:1.1b` | 1B |
| `gemma4:e2b` | 5,1B |
| `llama3.1:latest` | 8B |

Los tres son **de texto**. La prueba:

```
POST /v1/images/generations  →  HTTP 200 — 0 bytes
```

No es un error: el endpoint existe por compatibilidad y devuelve vacío. Un
servicio que responde 200 sin nada es peor que un 404, porque parece que anduvo.

**Conclusión:** esta máquina no puede dibujar. No hay modelo local de imágenes.

### 2.2 Que un modelo de texto escriba SVG

Antes de pagar una API, la idea intermedia: pedirle al modelo de texto que
escriba el SVG a mano y renderizarlo.

Lo que salió: círculos sueltos, bloques repetidos, formas que no se reconocían.
Y lo peor: **pedirle cambios lo empeoraba**. Cada iteración agregaba ruido.

El motivo es de fondo, no de calidad del modelo: un modelo de texto **no ve** lo
que dibuja. Predice tokens. El SVG es geometría, y la geometría no perdona un
número mal puesto. No es un problema de "usar un modelo más grande": es el tipo
de tarea equivocada.

**Conclusión:** descartado. Vale anotarlo porque es un camino que *parece* que
puede funcionar y consume una tarde.

### 2.3 Gemini (lo que quedó)

La única forma de cumplir el pedido era un modelo de imagen de verdad. Se usó la
API de Gemini. Modelos disponibles con la clave:

| Modelo | Para qué |
| --- | --- |
| `gemini-2.5-flash-image` | rápido y barato — **el default** |
| `gemini-3-pro-image` | más calidad, el doble de lento |
| `nano-banana-pro-preview` | alternativa |

Tiempos medidos: **6–15 s** con `flash-image`, **~15 s** con `pro`. Se cambia sin
tocar código con `ASISTENTE_MODELO_IMAGEN`.

Prueba manual antes de escribir la integración: un hongo rojo → "cambialo a azul
y agregale la palabra RETRO" → salió el hongo azul con el texto. La iteración
funciona.

**Consecuencia de que se cobre por imagen:** no hay proveedor simulado. El email
tiene modo consola porque mandar un mail de mentira no engaña a nadie; una imagen
simulada daría la falsa sensación de que el asistente anda. Sin clave, el botón
aparece deshabilitado y explica por qué.

---

## 3. Cómo se logra la iteración

Cada pedido de cambio manda la conversación completa, y el servidor **lee la
imagen anterior del disco y la vuelve a mandar como parte del contexto**. Eso es
lo que hace que el modelo ajuste el diseño en vez de empezar de cero.

Como la ruta de esa imagen la manda el cliente, el servidor valida con
`esRutaGenerada()` que sea un archivo generado por nosotros antes de leerlo. Sin
ese chequeo, un cliente malicioso podría pedirle al servidor que lea cualquier
archivo (`../../.env`) y devolverlo como imagen. Ese caso está cubierto por los
tests, no por confianza en el cliente.

Detalle de implementación: la conversación no se guarda en base. El estado vive
en el diálogo del navegador y viaja en cada request. Es simple y alcanza para una
herramienta de backoffice; si algún día hay que retomar un diseño días después,
ahí sí haría falta persistirlo.

---

## 4. El bug del formulario anidado

Al armar el diálogo apareció un error de hidratación. La causa: el chat tiene un
`<form>` y la página de alta de producto **también**. Un formulario adentro de
otro es HTML inválido; el navegador descarta el de adentro y React se queja al
hidratar.

La solución no fue sacar el formulario del diálogo, sino **montarlo con un portal
en `document.body`**. El portal cambia el árbol del DOM, no solo la posición
visual. Se usa `useSyncExternalStore` para montarlo recién en el cliente, porque
`document` no existe en el servidor.

Verificado: la página renderiza exactamente dos formularios y ninguno contiene al
otro.

**Lección:** un modal es posición y `z-index`, no estructura del DOM. Si el
diálogo tiene un formulario y vive dentro de otro, el portal es la solución
limpia; un overlay con CSS no cambia nada.

---

## 5. El botón de WhatsApp

El botón flotante aparecía también en el backoffice. Había dos caminos:

| Opción | Costo |
| --- | --- |
| Grupos de rutas `(tienda)` / `(admin)` con layouts separados | correcto estructuralmente, pero mueve archivos y toca imports |
| Componente cliente que lee `usePathname()` y devuelve `null` en `/admin` | unas líneas, en un solo archivo |

Se eligió la segunda. El costo es un componente cliente chico; el beneficio, no
reestructurar la app entera por un botón flotante. Si en algún momento aparecen
más diferencias de layout entre tienda y backoffice, ahí conviene pagar el costo
de los grupos de rutas.

Verificado ruta por ruta: aparece en `/`, `/catalogo` y `/carrito`; no aparece en
`/admin`, `/admin/productos/nuevo`, `/admin/pedidos` ni `/admin/stock`.

---

## 6. Tropiezos del entorno

Cosas que costaron tiempo y conviene tener a mano:

- **Este Next no es el que conocés.** `middleware.ts` pasó a `proxy.ts`,
  `params`/`searchParams` son Promises, `PageProps`/`LayoutProps` son globales y
  `after()` sale de `next/server`. Lo dice el propio `AGENTS.md` del repo: leer
  `node_modules/next/dist/docs/` antes de escribir código.
- **Prisma 7** lee solo `prisma7.config.ts`; el generador es `prisma-client` y
  exige `output`; hace falta un driver adapter; `prisma -v` no es un comando
  válido.
- **Scripts que importan `server-only`** necesitan
  `tsx --conditions=react-server`. Además `tsx` compila a CJS, así que no hay
  top-level `await`.
- **El servidor de desarrollo cachea** las variables de entorno y el cliente de
  Prisma: después de tocar `.env` o `schema.prisma`, hay que reiniciarlo.
- **Nunca `pkill -f "next dev"`**: el patrón también matchea la shell que lo
  invoca y la mata. Usar `pkill -f "[n]ext dev"` o matar por puerto.

---

## 7. Cómo se verificó

- **95 comprobaciones** en cinco suites: asistente 34, carrito 16, pedidos 13,
  parseo 16, mail-envío 16. Se corren con `npm run prueba:*`.
- `npx tsc --noEmit`, `npx eslint` y `npm run build` limpios.
- Pruebas manuales: generación e iteración de imágenes, el botón por ruta, que no
  haya formularios anidados, y los flujos del backoffice.
- Antes de hacer público el repo se escaneó **todo el historial** en busca de
  secretos: `.env` nunca se commiteó, y no aparecen `AUTH_SECRET`,
  `CRON_SECRET` ni `GOOGLE_API_KEY`. Solo hay placeholders en `.env.example` y el
  README.

---

## 8. Lo que no se pudo probar

- El asistente de punta a punta **después** de escrito: la cuenta se quedó sin
  crédito prepago y la API responde `402`.
- Login real con Google y GitHub (faltan credenciales).
- Un cobro real con MercadoPago.
- Los webhooks en local (necesitan una URL pública).

Está todo en [`PENDIENTES.md`](PENDIENTES.md), con el paso a paso para retomarlo.

---

## Regla para la próxima

Antes de probar "un modelo local" o "que escriba SVG", leer las secciones 2.1 y
2.2. Ya se hizo, y no funciona por una razón de fondo, no por falta de ajuste.

Si se cambia una decisión, actualizar este archivo. Si el cambio altera el
funcionamiento, también el README.
