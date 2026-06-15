CREATE TABLE public.sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id UUID NOT NULL REFERENCES public.mesas(id),
  mesero_id UUID NOT NULL REFERENCES public.usuarios(id),
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  abierta_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrada_en TIMESTAMPTZ,
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  total DECIMAL(10,2)
);

CREATE TABLE public.items_sesion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES public.sesiones(id) ON DELETE CASCADE,
  variante_id UUID NOT NULL REFERENCES public.variantes(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one open session per table
CREATE UNIQUE INDEX idx_sesion_mesa_abierta ON public.sesiones(mesa_id) WHERE estado = 'abierta';

CREATE INDEX idx_sesion_mesero ON public.sesiones(mesero_id);
CREATE INDEX idx_items_sesion ON public.items_sesion(sesion_id);
