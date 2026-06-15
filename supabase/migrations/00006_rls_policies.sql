-- Enable RLS on all tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_sesion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin' AND estado = 'activo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if user is active
CREATE OR REPLACE FUNCTION public.is_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND estado = 'activo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- usuarios: self + admin can read
CREATE POLICY usuarios_self_read ON public.usuarios
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY usuarios_admin_update ON public.usuarios
  FOR UPDATE USING (public.is_admin());

-- productos: all active users can read, only admin writes
CREATE POLICY productos_read ON public.productos
  FOR SELECT USING (public.is_active());

CREATE POLICY productos_admin_write ON public.productos
  FOR INSERT OR UPDATE OR DELETE USING (public.is_admin());

-- variantes: same as productos
CREATE POLICY variantes_read ON public.variantes
  FOR SELECT USING (public.is_active());

CREATE POLICY variantes_admin_write ON public.variantes
  FOR INSERT OR UPDATE OR DELETE USING (public.is_admin());

-- mesas: all active users can CRUD
CREATE POLICY mesas_read ON public.mesas
  FOR SELECT USING (public.is_active());

CREATE POLICY mesas_write ON public.mesas
  FOR INSERT OR UPDATE OR DELETE USING (public.is_active());

-- sesiones: mesero reads/creates own, admin reads all
CREATE POLICY sesiones_read ON public.sesiones
  FOR SELECT USING (auth.uid() = mesero_id OR public.is_admin());

CREATE POLICY sesiones_insert ON public.sesiones
  FOR INSERT WITH CHECK (auth.uid() = mesero_id AND public.is_active());

CREATE POLICY sesiones_update ON public.sesiones
  FOR UPDATE USING (auth.uid() = mesero_id OR public.is_admin());

-- items_sesion: same as sesiones
CREATE POLICY items_sesion_read ON public.items_sesion
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sesiones WHERE id = items_sesion.sesion_id AND (mesero_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY items_sesion_insert ON public.items_sesion
  FOR INSERT WITH CHECK (
    public.is_active() AND
    EXISTS (SELECT 1 FROM public.sesiones WHERE id = items_sesion.sesion_id AND mesero_id = auth.uid())
  );

CREATE POLICY items_sesion_delete ON public.items_sesion
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.sesiones WHERE id = items_sesion.sesion_id AND mesero_id = auth.uid())
  );

-- compras: only admin
CREATE POLICY compras_admin_all ON public.compras
  FOR ALL USING (public.is_admin());

-- items_compra: only admin
CREATE POLICY items_compra_admin_all ON public.items_compra
  FOR ALL USING (public.is_admin());

-- movimientos_stock: only admin
CREATE POLICY movimientos_stock_admin_all ON public.movimientos_stock
  FOR ALL USING (public.is_admin());
