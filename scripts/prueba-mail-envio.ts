/**
 * Prueba de la cotización de envío y de las plantillas de email.
 *
 * Son dos cosas que se rompen en silencio:
 *  - el envío: si el precio se calculara mal, se cobra de menos o de más
 *  - los mails: si una plantilla se rompe, no se nota hasta que un cliente
 *    reclama que no le llegó nada
 *
 * No manda ningún mail: solo arma el contenido y revisa que diga lo que tiene
 * que decir.
 *
 * Uso: npm run prueba:mail-envio
 */
import "dotenv/config";

import { UMBRAL_ENVIO_GRATIS_CENTS } from "../lib/constantes";
import { opcionesDeEnvio, resolverOpcionDeEnvio } from "../lib/envio";
import { formatearPrecio } from "../lib/formato";
import {
  plantillaBienvenida,
  plantillaCarritoAbandonado,
  plantillaCompraConfirmada,
  plantillaPedidoEnviado,
} from "../lib/email/plantillas";

let fallos = 0;

function verificar(descripcion: string, condicion: boolean, detalle = "") {
  if (condicion) {
    console.log(`  ✓ ${descripcion}`);
  } else {
    fallos++;
    console.log(`  ✗ ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  }
}

function buscar(valor: string) {
  return (aguja: string) => valor.includes(aguja);
}

async function main() {
  // ------------------------------------------------------------------ Envío
  console.log("\nCotización de envío\n");

  const chico = 1_000_00; // $1.000: por debajo del umbral
  const grande = UMBRAL_ENVIO_GRATIS_CENTS + 1;

  const opcionesBarato = await opcionesDeEnvio(chico);
  const opcionesCaro = await opcionesDeEnvio(grande);

  const domicilioBarato = opcionesBarato.find((o) => o.id === "domicilio")!;
  const domicilioCaro = opcionesCaro.find((o) => o.id === "domicilio")!;
  const retiro = opcionesBarato.find((o) => o.id === "retiro-local")!;

  verificar(
    "por debajo del umbral, el envío a domicilio se cobra",
    domicilioBarato.costoCentavos > 0,
    `recibido ${domicilioBarato.costoCentavos}`,
  );
  verificar(
    "desde el umbral, el envío a domicilio es gratis",
    domicilioCaro.costoCentavos === 0,
    `recibido ${domicilioCaro.costoCentavos}`,
  );
  verificar(
    "justo en el umbral ya es gratis (el límite es inclusivo)",
    (await resolverOpcionDeEnvio("domicilio", UMBRAL_ENVIO_GRATIS_CENTS))
      .costoCentavos === 0,
  );
  verificar(
    "el retiro en el local es siempre gratis",
    retiro.costoCentavos === 0,
  );
  verificar(
    "el envío gratis no se aplica al carrito chico por error",
    opcionesBarato.every((o) => o.id === "retiro-local" || o.costoCentavos > 0),
  );

  // Lo importante: el precio lo pone el servidor. El navegador solo manda un id.
  const conIdInventado = await resolverOpcionDeEnvio(
    "domicilio-gratis-por-favor",
    chico,
  );
  verificar(
    "un id inventado cae en la opción por defecto y se cobra igual",
    conIdInventado.costoCentavos === domicilioBarato.costoCentavos,
    `recibido ${conIdInventado.costoCentavos}`,
  );
  verificar(
    "un id vacío también cae en la opción por defecto",
    (await resolverOpcionDeEnvio(undefined, chico)).id === "domicilio",
  );
  verificar(
    "elegir retiro en el local sí da costo 0 (es una opción real)",
    (await resolverOpcionDeEnvio("retiro-local", chico)).costoCentavos === 0,
  );

  // ------------------------------------------------------------------ Mails
  console.log("\nPlantillas de email\n");

  const bienvenida = plantillaBienvenida("Ana", "https://tienda/catalogo");
  verificar(
    "la bienvenida saluda por nombre y linkea al catálogo",
    buscar(bienvenida.html)("Ana") &&
      buscar(bienvenida.html)("https://tienda/catalogo"),
  );

  const items = [
    {
      productName: "Remera Pikachu",
      size: "M",
      color: "Negro",
      quantity: 2,
      unitCents: 2_999_90,
    },
    {
      productName: "Remera Teclado",
      size: "L",
      color: "Blanco",
      quantity: 1,
      unitCents: 3_500_00,
    },
  ];
  const total = items.reduce((a, i) => a + i.unitCents * i.quantity, 0);

  const compra = plantillaCompraConfirmada(
    "ABC12345",
    items,
    total,
    "https://tienda/cuenta/pedidos",
  );
  verificar(
    "la confirmación lleva el número de pedido en el asunto",
    buscar(compra.asunto)("ABC12345"),
  );
  verificar(
    "la confirmación lista los dos productos",
    buscar(compra.html)("Pikachu") && buscar(compra.html)("Teclado"),
  );
  verificar(
    "la confirmación muestra el total formateado",
    buscar(compra.html)(formatearPrecio(total)),
    `buscado ${formatearPrecio(total)}`,
  );
  verificar(
    "la confirmación calcula el subtotal de 2 unidades",
    buscar(compra.html)(formatearPrecio(items[0].unitCents * 2)),
    `buscado ${formatearPrecio(items[0].unitCents * 2)}`,
  );

  const conSeguimiento = plantillaPedidoEnviado(
    "ABC12345",
    "https://tienda/cuenta/pedidos",
    "CA123456789AR",
  );
  const sinSeguimiento = plantillaPedidoEnviado(
    "ABC12345",
    "https://tienda/cuenta/pedidos",
  );
  verificar(
    "el aviso de envío incluye el código cuando existe",
    buscar(conSeguimiento.html)("CA123456789AR"),
  );
  verificar(
    "el aviso de envío NO menciona seguimiento si no se cargó",
    !buscar(sinSeguimiento.texto)("Seguimiento"),
  );

  const abandonado = plantillaCarritoAbandonado(
    items,
    "https://tienda/carrito",
  );
  verificar(
    "el recordatorio de carrito lista los productos y linkea al carrito",
    buscar(abandonado.html)("Pikachu") &&
      buscar(abandonado.html)("https://tienda/carrito"),
  );

  console.log(
    fallos === 0
      ? "\nTodo bien: envío y mails funcionan como se espera."
      : `\n${fallos} comprobación(es) fallaron.`,
  );

  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
