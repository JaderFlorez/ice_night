CREATE TABLE public.compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor TEXT,
  notas TEXT,
  costo_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.items_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
  variante_id UUID NOT NULL REFERENCES public.variantes(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE public.movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variante_id UUID NOT NULL REFERENCES public.variantes(id),
  cantidad INT NOT NULL CHECK (cantidad != 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'venta', 'ajuste')),
  referencia_id UUID,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movimientos_variante ON public.movimientos_stock(variante_id);
CREATE INDEX idx_items_compra ON public.items_compra(compra_id);
