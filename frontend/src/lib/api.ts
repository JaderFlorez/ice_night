const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function getHeaders(): Promise<HeadersInit> {
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export interface UsuarioDTO {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'mesero';
  estado: 'pendiente' | 'activo' | 'rechazado';
  created_at: string;
}

export async function fetchPerfil(): Promise<UsuarioDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/auth/perfil`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(err.error || 'Error al obtener perfil');
  }
  return res.json();
}

export async function fetchPendientes(): Promise<{ usuarios: UsuarioDTO[] }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/admin/usuarios/pendientes`, { headers });
  if (!res.ok) throw new Error('Error al obtener pendientes');
  return res.json();
}

export async function aprobarUsuario(id: string, estado: 'activo' | 'rechazado'): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/admin/usuarios/${id}/estado`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error('Error al actualizar usuario');
}

// ──────────────────────────────
// Catálogo — tipos
// ──────────────────────────────

export type CategoriaProducto =
  | 'cerveza'
  | 'vino'
  | 'licor'
  | 'whisky'
  | 'vodka'
  | 'ron'
  | 'granizado'
  | 'energizante'
  | 'gaseosa'
  | 'agua'
  | 'snack'
  | 'otro';

export interface ProductoDTO {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaProducto;
  tiene_variantes: boolean;
  activo: boolean;
  creado_en: string;
  variantes: VarianteDTO[];
}

export interface VarianteDTO {
  id: string;
  producto_id: string;
  nombre: string;
  sku: string;
  precio: number | null;
  costo: number | null;
  stock: number;
  stock_minimo: number;
  activa: boolean;
}

export interface CrearProductoData {
  nombre: string;
  descripcion?: string;
  categoria: CategoriaProducto;
  tiene_variantes: boolean;
  precio?: number;
  costo?: number;
  stock?: number;
}

export interface ActualizarProductoData {
  nombre?: string;
  descripcion?: string;
  categoria?: CategoriaProducto;
  tiene_variantes?: boolean;
  costo?: number;
}

export interface CrearVarianteData {
  nombre: string;
  sku: string;
  precio?: number;
  costo?: number;
  stock?: number;
  stock_minimo?: number;
}

export interface ActualizarVarianteData {
  nombre?: string;
  sku?: string;
  precio?: number;
  costo?: number;
  stock?: number;
  stock_minimo?: number;
}

// ──────────────────────────────
// Catálogo — funciones
// ──────────────────────────────

export async function fetchProductos(q?: string, categoria?: string): Promise<ProductoDTO[]> {
  const headers = await getHeaders();
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categoria) params.set('categoria', categoria);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/productos${qs ? `?${qs}` : ''}`, { headers });
  if (!res.ok) throw new Error('Error al obtener productos');
  const json = await res.json();
  return json.data;
}

export async function fetchProducto(id: string): Promise<ProductoDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/productos/${id}`, { headers });
  if (!res.ok) throw new Error('Error al obtener producto');
  const json = await res.json();
  return json.data;
}

export async function crearProducto(data: CrearProductoData): Promise<ProductoDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear producto' }));
    throw new Error(err.error || 'Error al crear producto');
  }
  const json = await res.json();
  return json.data;
}

export async function actualizarProducto(id: string, data: ActualizarProductoData): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/productos/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar producto' }));
    throw new Error(err.error || 'Error al actualizar producto');
  }
}

export async function eliminarProducto(id: string): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/productos/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar producto' }));
    throw new Error(err.error || 'Error al eliminar producto');
  }
}

export async function fetchNextSku(categoria: string): Promise<{ sku: string }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/productos/next-sku?categoria=${encodeURIComponent(categoria)}`, {
    headers,
  });
  if (!res.ok) throw new Error('Error al obtener próximo SKU');
  const json = await res.json();
  return json.data;
}

export async function fetchVariantes(productoId: string): Promise<VarianteDTO[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/productos/${productoId}/variantes`, { headers });
  if (!res.ok) throw new Error('Error al obtener variantes');
  const json = await res.json();
  return json.data;
}

export async function crearVariante(productoId: string, data: CrearVarianteData): Promise<VarianteDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/productos/${productoId}/variantes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear variante' }));
    throw new Error(err.error || 'Error al crear variante');
  }
  const json = await res.json();
  return json.data;
}

export async function actualizarVariante(id: string, data: ActualizarVarianteData): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/variantes/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar variante' }));
    throw new Error(err.error || 'Error al actualizar variante');
  }
}

export async function eliminarVariante(id: string): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/variantes/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar variante' }));
    throw new Error(err.error || 'Error al eliminar variante');
  }
}

// ──────────────────────────────
// Mesas — tipos
// ──────────────────────────────

export interface MesaDTO {
  id: string;
  numero: number;
  capacidad: number;
  ubicacion: string | null;
  activa: boolean;
  created_at: string;
}

export interface CrearMesaData {
  numero: number;
  capacidad?: number;
  ubicacion?: string;
}

// ──────────────────────────────
// Sesiones — tipos
// ──────────────────────────────

export type EstadoSesion = 'abierta' | 'cerrada';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface SesionDTO {
  id: string;
  mesa_id: string;
  mesero_id: string;
  estado: EstadoSesion;
  abierta_en: string;
  cerrada_en?: string;
  metodo_pago?: MetodoPago;
  total?: number;
}

export interface ItemSesionDTO {
  id: string;
  sesion_id: string;
  variante_id: string;
  variante_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  creado_en: string;
}

export interface CuentaDTO {
  sesion: SesionDTO;
  items: ItemSesionDTO[];
  total: number;
}

export interface AgregarConsumoData {
  variante_id: string;
  cantidad: number;
}

// ──────────────────────────────
// Mesas — funciones
// ──────────────────────────────

export async function fetchMesas(): Promise<MesaDTO[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/mesas`, { headers });
  if (!res.ok) throw new Error('Error al obtener mesas');
  const json = await res.json();
  return json.data;
}

export async function crearMesa(data: CrearMesaData): Promise<MesaDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/mesas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear mesa' }));
    throw new Error(err.error || 'Error al crear mesa');
  }
  const json = await res.json();
  return json.data;
}

export async function actualizarMesa(id: string, data: Partial<CrearMesaData>): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/mesas/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar mesa' }));
    throw new Error(err.error || 'Error al actualizar mesa');
  }
}

export async function eliminarMesa(id: string): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/mesas/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Error al eliminar mesa');
}

// ──────────────────────────────
// Sesiones — funciones
// ──────────────────────────────

export async function abrirSesion(mesaId: string): Promise<SesionDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/mesas/${mesaId}/abrir`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al abrir sesión' }));
    throw new Error(err.error || 'Error al abrir sesión');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchSesionesActivas(): Promise<SesionDTO[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/sesiones/activas`, { headers });
  if (!res.ok) throw new Error('Error al obtener sesiones activas');
  const json = await res.json();
  return json.data;
}

export async function fetchSesion(id: string): Promise<SesionDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/sesiones/${id}`, { headers });
  if (!res.ok) throw new Error('Error al obtener sesión');
  const json = await res.json();
  return json.data;
}

export async function cerrarSesion(id: string, metodoPago?: MetodoPago): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/sesiones/${id}/cerrar`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ metodo_pago: metodoPago }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al cerrar sesión' }));
    throw new Error(err.error || 'Error al cerrar sesión');
  }
}

export async function agregarConsumo(sesionId: string, data: AgregarConsumoData): Promise<ItemSesionDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/sesiones/${sesionId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al agregar consumo' }));
    throw new Error(err.error || 'Error al agregar consumo');
  }
  const json = await res.json();
  return json.data;
}

export async function obtenerCuenta(sesionId: string): Promise<CuentaDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/sesiones/${sesionId}/cuenta`, { headers });
  if (!res.ok) throw new Error('Error al obtener cuenta');
  const json = await res.json();
  return json.data;
}

export async function eliminarConsumo(sesionId: string, itemId: string): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/sesiones/${sesionId}/items/${itemId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar consumo' }));
    throw new Error(err.error || 'Error al eliminar consumo');
  }
}

export interface ActualizarConsumoData {
  cantidad: number;
}

export async function actualizarConsumo(
  sesionId: string,
  itemId: string,
  data: ActualizarConsumoData,
): Promise<ItemSesionDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/sesiones/${sesionId}/items/${itemId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar consumo' }));
    throw new Error(err.error || 'Error al actualizar consumo');
  }
  const json = await res.json();
  return json.data;
}

// ──────────────────────────────
// Inventario — tipos
// ──────────────────────────────

export interface CompraDTO {
  id: string;
  proveedor: string | null;
  notas: string | null;
  costo_total: number;
  creado_en: string;
  items: ItemCompraDTO[];
}

export interface ItemCompraDTO {
  id: string;
  compra_id: string;
  variante_id: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
}

export interface MovimientoStockDTO {
  id: string;
  variante_id: string;
  cantidad: number;
  tipo: 'compra' | 'venta' | 'ajuste';
  referencia_id: string | null;
  creado_en: string;
}

export interface AlertaStockDTO {
  variante_id: string;
  sku: string;
  producto_nombre: string;
  variante_nombre: string;
  stock: number;
  stock_minimo: number;
}

export interface RegistrarCompraData {
  proveedor?: string;
  notas?: string;
  items: Array<{
    variante_id: string;
    cantidad: number;
    costo_unitario: number;
  }>;
}

// ──────────────────────────────
// Inventario — funciones
// ──────────────────────────────

export async function fetchCompras(): Promise<CompraDTO[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/compras`, { headers });
  if (!res.ok) throw new Error('Error al obtener compras');
  const json = await res.json();
  return json.data;
}

export async function fetchCompra(id: string): Promise<CompraDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/compras/${id}`, { headers });
  if (!res.ok) throw new Error('Error al obtener compra');
  const json = await res.json();
  return json.data;
}

export async function registrarCompra(data: RegistrarCompraData): Promise<CompraDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/compras`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al registrar compra' }));
    throw new Error(err.error || 'Error al registrar compra');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchMovimientos(varianteId: string): Promise<MovimientoStockDTO[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/inventario/movimientos?variante_id=${encodeURIComponent(varianteId)}`, { headers });
  if (!res.ok) throw new Error('Error al obtener movimientos');
  const json = await res.json();
  return json.data;
}

export async function fetchAlertas(): Promise<AlertaStockDTO[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/inventario/alertas`, { headers });
  if (!res.ok) throw new Error('Error al obtener alertas');
  const json = await res.json();
  return json.data;
}

// ──────────────────────────────
// Dashboard — tipos
// ──────────────────────────────

export interface DashboardHoyDTO {
  ventas: {
    total_sesiones: number;
    sesiones_activas: number;
    total_recaudado: number;
  };
  mesas: {
    total: number;
    activas: number;
  };
  alertas: number;
}

export interface TopProductoDTO {
  variante_id: string;
  sku: string;
  producto_nombre: string;
  variante_nombre: string;
  total_vendido: number;
  total_recaudado: number;
}

export interface HistorialVentaDetalleDTO {
  fecha: string;
  sesiones: number;
  total: number;
  costo: number;
  utilidad: number;
}

export interface HistorialVentasDTO {
  periodo: string;
  total_sesiones: number;
  total_recaudado: number;
  productos_vendidos: number;
  total_costos: number;
  utilidad: number;
  desglose: HistorialVentaDetalleDTO[];
}

// ──────────────────────────────
// Dashboard — funciones
// ──────────────────────────────

export async function fetchDashboardHoy(): Promise<DashboardHoyDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/dashboard/hoy`, { headers });
  if (!res.ok) throw new Error('Error al obtener dashboard');
  const json = await res.json();
  return json.data;
}

export async function fetchTopProductos(): Promise<TopProductoDTO[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/dashboard/top-productos`, { headers });
  if (!res.ok) throw new Error('Error al obtener top productos');
  const json = await res.json();
  return json.data;
}

export async function fetchHistorialVentas(
  periodo: string,
): Promise<HistorialVentasDTO> {
  const headers = await getHeaders();
  const res = await fetch(
    `${API_BASE}/dashboard/historial-ventas?periodo=${encodeURIComponent(periodo)}`,
    { headers },
  );
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: 'Error al obtener historial de ventas' }));
    throw new Error(err.error || 'Error al obtener historial de ventas');
  }
  const json = await res.json();
  return json.data;
}

// ──────────────────────────────
// Formateo de moneda (COP)
// ──────────────────────────────

/**
 * Formatea un número como pesos colombianos.
 * Ejemplo: formatCOP(10500) → "$ 10.500"
 */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un número para mostrar en un input (solo separador de miles, sin $).
 * Ejemplo: formatCOPInput(1500) → "1.500"
 */
export function formatCOPInput(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parsea un valor ingresado en formato colombiano a número.
 * "10.000" → 10000, "500" → 500, "" → 0
 */
export function parseCOPInput(value: string): number {
  if (!value) return 0;
  // Saca los puntos de separador de miles, reemplaza coma decimal por punto
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
