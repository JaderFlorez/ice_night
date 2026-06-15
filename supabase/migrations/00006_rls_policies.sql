-- ==========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==========================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_sesion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. HELPER FUNCTIONS (SECURITY DEFINER)
-- ==========================================

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

-- ==========================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ==========================================

-- --- USUARIOS ---
-- Self + Admin can read
CREATE POLICY usuarios_self_read ON public.usuarios
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Only Admin can update
CREATE POLICY usuarios_admin_update ON public.usuarios
  FOR UPDATE USING (public.is_admin());


-- --- PRODUCTOS ---
-- All active users can read
CREATE POLICY productos_read ON public.productos
  FOR SELECT USING (public.is_active());

-- Only Admin can write (Separated to fix PostgreSQL syntax error)
CREATE POLICY productos_admin_insert ON public.productos
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY productos_admin_update ON public.productos
  FOR UPDATE USING (public.is_admin());

CREATE POLICY productos_admin_delete ON public.productos
  FOR DELETE USING (public.is_admin());


-- --- VARIANTES ---
-- All active users can read
CREATE POLICY variantes_read ON public.variantes
  FOR SELECT USING (public.is_active());

-- Only Admin can write (Separated to fix PostgreSQL syntax error)
CREATE POLICY variantes_admin_insert ON public.variantes
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY variantes_admin_update ON public.variantes
  FOR UPDATE USING (public.is_admin());

CREATE POLICY variantes_admin_delete ON public.variantes
  FOR DELETE USING (public.is_admin());


-- --- MESAS ---
-- All active users can read
CREATE POLICY mesas_read ON public.mesas
  FOR SELECT USING (public.is_active());

-- All active users can write (Separated to fix PostgreSQL syntax error)
CREATE POLICY mesas_active_insert ON public.mesas
  FOR INSERT WITH CHECK (public.is_active());

CREATE POLICY mesas_active_update ON public.mesas
  FOR UPDATE USING (public.is_active());

CREATE POLICY mesas_active_delete ON public.mesas
  FOR DELETE USING (public.is_active());


-- --- SESIONES ---
-- Mesero reads own, Admin reads all
CREATE POLICY sesiones_read ON public.sesiones
  FOR SELECT USING (auth.uid() = mesero_id OR public.is_admin());

-- Mesero creates own if active
CREATE POLICY sesiones_insert ON public.sesiones
  FOR INSERT WITH CHECK (auth.uid() = mesero_id AND public.is_active());

-- Mesero updates own, Admin updates all
CREATE POLICY sesiones_update ON public.sesiones
  FOR UPDATE USING (auth.uid() = mesero_id OR public.is_admin());


-- --- ITEMS_SESION ---
-- Mesero reads own session items, Admin reads all
CREATE POLICY items_sesion_read ON public.items_sesion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sesiones 
      WHERE id = items_sesion.sesion_id AND (mesero_id = auth.uid() OR public.is_admin())
    )
  );

-- Active mesero inserts into their own session
CREATE POLICY items_sesion_insert ON public.items_sesion
  FOR INSERT WITH CHECK (
    public.is_active() AND
    EXISTS (
      SELECT 1 FROM public.sesiones 
      WHERE id = items_sesion.sesion_id AND mesero_id = auth.uid()
    )
  );

-- Mesero deletes from their own session
CREATE POLICY items_sesion_delete ON public.items_sesion
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sesiones 
      WHERE id = items_sesion.sesion_id AND mesero_id = auth.uid()
    )
  );


-- --- COMPRAS (Only Admin) ---
CREATE POLICY compras_admin_all ON public.compras
  FOR ALL USING (public.is_admin());


-- --- ITEMS_COMPRA (Only Admin) ---
CREATE POLICY items_compra_admin_all ON public.items_compra
  FOR ALL USING (public.is_admin());


-- --- MOVIMIENTOS_STOCK (Only Admin) ---
CREATE POLICY movimientos_stock_admin_all ON public.movimientos_stock
  FOR ALL USING (public.is_admin());