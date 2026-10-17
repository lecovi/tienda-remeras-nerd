import type { Mensaje, ProveedorDeEmail } from "@/lib/email/tipos";

/**
 * Proveedor de desarrollo: no manda nada, imprime el mail en consola.
 *
 * Existe para que la app sea usable sin credenciales. Es importante que sea
 * el fallback y no un error: si no hay proveedor configurado, comprar tiene
 * que seguir funcionando, solo que sin mails.
 */
export const proveedorConsola: ProveedorDeEmail = {
  nombre: "consola",
  async enviar(mensaje: Mensaje) {
    const lineas = [
      "",
      "──────── EMAIL (no enviado: falta configurar un proveedor) ────────",
      `Para:    ${mensaje.para}`,
      `Asunto:  ${mensaje.asunto}`,
    ];

    // En desarrollo se imprime también el cuerpo, porque hay mails que solo
    // sirven si podés leer el contenido: el link de acceso, por ejemplo, es
    // imposible de probar sin verlo. En producción NO se imprime: el log no es
    // lugar para un link que entra a una cuenta, y ahí solo hace falta saber
    // que se intentó mandar.
    if (process.env.NODE_ENV !== "production") {
      lineas.push(
        "──────────────────────────────────────────────────────────────────",
        mensaje.texto ?? "(este mail no trae versión en texto plano)",
      );
    }

    lineas.push("──────────────────────────────────────────────────────────────────");

    console.log(lineas.join("\n"));
  },
};
