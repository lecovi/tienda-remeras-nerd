type Props = {
  itemId: string;
  cantidad: number;
  stock: number;
  /** Server Action que persiste el cambio; se recibe como prop para no atar el componente a una única acción. */
  accion: (formData: FormData) => Promise<void>;
};

/**
 * Control de cantidad. Son dos formularios con Server Action en lugar de un
 * componente con estado: funciona sin JavaScript y no necesita hidratarse.
 */
export function BotonCantidad({ itemId, cantidad, stock, accion }: Props) {
  const boton =
    "grid h-9 w-9 place-items-center rounded-lg border border-borde text-sm font-bold transition hover:border-marca-500 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center gap-2">
      <form action={accion}>
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="cantidad" value={cantidad - 1} />
        <button type="submit" className={boton} aria-label="Quitar una unidad">
          −
        </button>
      </form>

      <span className="tabular w-8 text-center text-sm font-semibold">
        {cantidad}
      </span>

      <form action={accion}>
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="cantidad" value={cantidad + 1} />
        <button
          type="submit"
          className={boton}
          disabled={cantidad >= stock}
          aria-label="Agregar una unidad"
          title={cantidad >= stock ? `Stock máximo: ${stock}` : undefined}
        >
          +
        </button>
      </form>
    </div>
  );
}
