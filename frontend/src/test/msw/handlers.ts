import { http, HttpResponse } from 'msw';

const API_BASE = '/api';

// ─── Auth ───
export const authHandlers = [
  http.get(`${API_BASE}/auth/perfil`, () => {
    return HttpResponse.json({
      id: 'user-1',
      email: 'admin@icenight.com',
      nombre: 'Admin',
      rol: 'admin',
      estado: 'activo',
      created_at: '2025-01-01T00:00:00Z',
    });
  }),
];

// ─── Productos / Catálogo ───
const mockProductos = [
  {
    id: 'prod-1',
    nombre: 'Aguila light',
    descripcion: 'Cerveza ligera',
    categoria: 'cerveza',
    tiene_variantes: true,
    activo: true,
    creado_en: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-1',
        producto_id: 'prod-1',
        nombre: 'Botella 330ml',
        sku: 'AGL-001',
        precio: 3500,
        costo: 2000,
        stock: 100,
        stock_minimo: 20,
        activa: true,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'var-2',
        producto_id: 'prod-1',
        nombre: 'Lata 473ml',
        sku: 'AGL-002',
        precio: 4000,
        costo: 2500,
        stock: 50,
        stock_minimo: 15,
        activa: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    ],
  },
  {
    id: 'prod-2',
    nombre: 'Whisky Johnnie Walker',
    descripcion: 'Whisky escocés',
    categoria: 'whisky',
    tiene_variantes: false,
    activo: true,
    creado_en: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-3',
        producto_id: 'prod-2',
        nombre: 'Botella 750ml',
        sku: 'JW-001',
        precio: 85000,
        costo: 55000,
        stock: 10,
        stock_minimo: 5,
        activa: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    ],
  },
  {
    id: 'prod-3',
    nombre: 'Gaseosa Coca-Cola',
    descripcion: null,
    categoria: 'gaseosa',
    tiene_variantes: false,
    activo: true,
    creado_en: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-4',
        producto_id: 'prod-3',
        nombre: 'Lata 355ml',
        sku: 'COKE-001',
        precio: 2500,
        costo: 1500,
        stock: 200,
        stock_minimo: 50,
        activa: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    ],
  },
];

export const catalogoHandlers = [
  http.get(`${API_BASE}/productos/next-sku`, ({ request }) => {
    const url = new URL(request.url);
    const categoria = url.searchParams.get('categoria') ?? 'otro';
    const prefix = categoria.slice(0, 3).toUpperCase();
    return HttpResponse.json({ data: { sku: `${prefix}-001` } });
  }),

  http.get(`${API_BASE}/productos`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const cat = url.searchParams.get('categoria');
    let filtered = [...mockProductos];
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.variantes.some((v) => v.sku.toLowerCase().includes(q)),
      );
    }
    if (cat) {
      filtered = filtered.filter((p) => p.categoria === cat);
    }
    return HttpResponse.json({ data: filtered });
  }),

  http.get(`${API_BASE}/productos/:id`, ({ params }) => {
    const p = mockProductos.find((p) => p.id === params.id);
    if (!p) return HttpResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    return HttpResponse.json({ data: p });
  }),

  http.post(`${API_BASE}/productos`, async ({ request }) => {
    const body = await request.json() as any;
    const newProduct = {
      id: `prod-${Date.now()}`,
      ...body,
      activo: true,
      creado_en: new Date().toISOString(),
      created_at: new Date().toISOString(),
      variantes: body.tiene_variantes ? [] : [
        {
          id: `var-${Date.now()}`,
          producto_id: `prod-${Date.now()}`,
          nombre: 'Única',
          sku: 'SKU-001',
          precio: body.precio ?? 0,
          costo: 0,
          stock: body.stock ?? 0,
          stock_minimo: 5,
          activa: true,
          created_at: new Date().toISOString(),
        },
      ],
    };
    return HttpResponse.json({ data: newProduct }, { status: 201 });
  }),

  http.patch(`${API_BASE}/productos/:id`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ mensaje: 'Producto actualizado correctamente' });
  }),

  http.delete(`${API_BASE}/productos/:id`, ({ params }) => {
    // Simulate FK constraint for products with inventory/consumption history
    if (params.id === 'prod-1') {
      return HttpResponse.json(
        {
          error:
            'No se puede eliminar el producto porque tiene registros asociados. Desactive el producto en su lugar.',
        },
        { status: 409 },
      );
    }
    return HttpResponse.json({ mensaje: 'Producto eliminado correctamente' });
  }),

  // ─── Variantes ───
  http.get(`${API_BASE}/productos/:productoId/variantes`, ({ params }) => {
    const p = mockProductos.find((p) => p.id === params.productoId);
    if (!p) return HttpResponse.json({ data: [] });
    return HttpResponse.json({ data: p.variantes });
  }),

  http.post(`${API_BASE}/productos/:productoId/variantes`, async ({ request, params }) => {
    const body = await request.json() as any;
    const newVariant = {
      id: `var-${Date.now()}`,
      producto_id: params.productoId as string,
      ...body,
      activa: true,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json({ data: newVariant }, { status: 201 });
  }),

  http.patch(`${API_BASE}/variantes/:id`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ mensaje: 'Variante actualizada correctamente' });
  }),

  http.delete(`${API_BASE}/variantes/:id`, ({ params }) => {
    if (params.id === 'var-1') {
      return HttpResponse.json(
        {
          error:
            'No se puede eliminar la variante porque tiene registros asociados. Desactive la variante en su lugar.',
        },
        { status: 409 },
      );
    }
    return HttpResponse.json({ mensaje: 'Variante eliminada correctamente' });
  }),
];

// ─── Mesas ───
const mockMesas = [
  { id: 'mesa-1', numero: 1, capacidad: 4, ubicacion: 'Planta baja', activa: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'mesa-2', numero: 2, capacidad: 6, ubicacion: 'VIP', activa: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'mesa-3', numero: 3, capacidad: 2, ubicacion: 'Barra', activa: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'mesa-4', numero: 4, capacidad: 8, ubicacion: 'Terraza', activa: false, created_at: '2025-01-01T00:00:00Z' },
];

export const mesasHandlers = [
  http.get(`${API_BASE}/mesas`, () => {
    return HttpResponse.json({ data: mockMesas });
  }),

  http.post(`${API_BASE}/mesas`, async ({ request }) => {
    const body = await request.json() as any;
    const newMesa = {
      id: `mesa-${Date.now()}`,
      ...body,
      activa: true,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json({ data: newMesa }, { status: 201 });
  }),

  http.patch(`${API_BASE}/mesas/:id`, async ({ request }) => {
    return HttpResponse.json({ mensaje: 'Mesa actualizada correctamente' });
  }),

  http.delete(`${API_BASE}/mesas/:id`, () => {
    return HttpResponse.json({ mensaje: 'Mesa eliminada correctamente' });
  }),
];

// ─── Sesiones ───
const mockSesionesActivas = [
  {
    id: 'sesion-1',
    mesa_id: 'mesa-2',
    mesero_id: 'user-2',
    estado: 'abierta' as const,
    abierta_en: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockCuentaSesion1 = {
  sesion: mockSesionesActivas[0],
  items: [
    {
      id: 'item-1',
      sesion_id: 'sesion-1',
      variante_id: 'var-1',
      cantidad: 2,
      precio_unitario: 3500,
      subtotal: 7000,
      creado_en: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'item-2',
      sesion_id: 'sesion-1',
      variante_id: 'var-4',
      cantidad: 1,
      precio_unitario: 2500,
      subtotal: 2500,
      creado_en: new Date(Date.now() - 900000).toISOString(),
    },
  ],
  total: 9500,
};

export const sesionesHandlers = [
  http.post(`${API_BASE}/mesas/:id/abrir`, async ({ params }) => {
    const newSesion = {
      id: `sesion-${Date.now()}`,
      mesa_id: params.id,
      mesero_id: 'user-1',
      estado: 'abierta' as const,
      abierta_en: new Date().toISOString(),
    };
    return HttpResponse.json({ data: newSesion }, { status: 201 });
  }),

  http.get(`${API_BASE}/sesiones/activas`, () => {
    return HttpResponse.json({ data: mockSesionesActivas });
  }),

  http.get(`${API_BASE}/sesiones/:id`, ({ params }) => {
    const s = mockSesionesActivas.find((s) => s.id === params.id);
    if (!s) return HttpResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    return HttpResponse.json({ data: s });
  }),

  http.get(`${API_BASE}/sesiones/:id/cuenta`, ({ params }) => {
    const id = params.id as string;
    if (id === 'sesion-1') {
      return HttpResponse.json({ data: mockCuentaSesion1 });
    }
    return HttpResponse.json({
      data: {
        sesion: { id },
        items: [],
        total: 0,
      },
    });
  }),

  http.post(`${API_BASE}/sesiones/:id/items`, async ({ request, params }) => {
    const body = await request.json() as any;
    const newItem = {
      id: `item-${Date.now()}`,
      sesion_id: params.id as string,
      variante_id: body.variante_id,
      cantidad: body.cantidad,
      precio_unitario: 3500,
      subtotal: body.cantidad * 3500,
      creado_en: new Date().toISOString(),
    };
    return HttpResponse.json({ data: newItem }, { status: 201 });
  }),

  http.patch(`${API_BASE}/sesiones/:sesionId/items/:itemId`, async ({ request, params }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      data: {
        id: params.itemId,
        sesion_id: params.sesionId,
        variante_id: 'var-1',
        variante_nombre: 'Aguila light — Botella 330ml',
        cantidad: body.cantidad,
        precio_unitario: 3500,
        subtotal: body.cantidad * 3500,
        creado_en: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_BASE}/sesiones/:id/items/:itemId`, () => {
    return HttpResponse.json({ mensaje: 'Consumo eliminado correctamente' });
  }),

  http.post(`${API_BASE}/sesiones/:id/cerrar`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ mensaje: 'Sesión cerrada correctamente' });
  }),
];

// ─── Dashboard ───
const mockDashboardHoy = {
  ventas: {
    total_sesiones: 15,
    sesiones_activas: 3,
    total_recaudado: 450000,
  },
  mesas: {
    total: 10,
    activas: 3,
  },
  alertas: 2,
};

const mockTopProductos = [
  {
    variante_id: 'var-1',
    sku: 'AGL-001',
    producto_nombre: 'Aguila light',
    variante_nombre: 'Botella 330ml',
    total_vendido: 25,
    total_recaudado: 87500,
  },
  {
    variante_id: 'var-4',
    sku: 'COKE-001',
    producto_nombre: 'Gaseosa Coca-Cola',
    variante_nombre: 'Lata 355ml',
    total_vendido: 18,
    total_recaudado: 45000,
  },
];

const mockHistorialVentas: Record<string, unknown> = {
  day: {
    periodo: 'day',
    total_sesiones: 8,
    total_recaudado: 245000,
    productos_vendidos: 34,
    total_costos: 73500,
    utilidad: 171500,
    desglose: [
      { fecha: '2026-06-24 10:00:00', sesiones: 2, total: 45000, costo: 13500, utilidad: 31500 },
      { fecha: '2026-06-24 14:00:00', sesiones: 3, total: 85000, costo: 25500, utilidad: 59500 },
      { fecha: '2026-06-24 18:00:00', sesiones: 3, total: 115000, costo: 34500, utilidad: 80500 },
    ],
  },
  week: {
    periodo: 'week',
    total_sesiones: 45,
    total_recaudado: 1250000,
    productos_vendidos: 320,
    total_costos: 375000,
    utilidad: 875000,
    desglose: [
      { fecha: '2026-06-18', sesiones: 6, total: 180000, costo: 54000, utilidad: 126000 },
      { fecha: '2026-06-19', sesiones: 8, total: 220000, costo: 66000, utilidad: 154000 },
      { fecha: '2026-06-20', sesiones: 10, total: 310000, costo: 93000, utilidad: 217000 },
      { fecha: '2026-06-21', sesiones: 5, total: 140000, costo: 42000, utilidad: 98000 },
      { fecha: '2026-06-22', sesiones: 7, total: 195000, costo: 58500, utilidad: 136500 },
      { fecha: '2026-06-23', sesiones: 4, total: 105000, costo: 31500, utilidad: 73500 },
      { fecha: '2026-06-24', sesiones: 5, total: 100000, costo: 30000, utilidad: 70000 },
    ],
  },
  month: {
    periodo: 'month',
    total_sesiones: 180,
    total_recaudado: 5200000,
    productos_vendidos: 1400,
    total_costos: 1560000,
    utilidad: 3640000,
    desglose: [
      { fecha: '2026-06-01', sesiones: 12, total: 320000, costo: 96000, utilidad: 224000 },
      { fecha: '2026-06-08', sesiones: 15, total: 410000, costo: 123000, utilidad: 287000 },
      { fecha: '2026-06-15', sesiones: 10, total: 280000, costo: 84000, utilidad: 196000 },
      { fecha: '2026-06-22', sesiones: 8, total: 210000, costo: 63000, utilidad: 147000 },
    ],
  },
  year: {
    periodo: 'year',
    total_sesiones: 2100,
    total_recaudado: 58000000,
    productos_vendidos: 16800,
    total_costos: 17400000,
    utilidad: 40600000,
    desglose: [
      { fecha: '2026-01', sesiones: 180, total: 4800000, costo: 1440000, utilidad: 3360000 },
      { fecha: '2026-02', sesiones: 160, total: 4200000, costo: 1260000, utilidad: 2940000 },
      { fecha: '2026-03', sesiones: 200, total: 5500000, costo: 1650000, utilidad: 3850000 },
      { fecha: '2026-04', sesiones: 175, total: 4900000, costo: 1470000, utilidad: 3430000 },
      { fecha: '2026-05', sesiones: 190, total: 5100000, costo: 1530000, utilidad: 3570000 },
      { fecha: '2026-06', sesiones: 165, total: 4500000, costo: 1350000, utilidad: 3150000 },
    ],
  },
};

export const dashboardHandlers = [
  http.get(`${API_BASE}/dashboard/hoy`, () => {
    return HttpResponse.json({ data: mockDashboardHoy });
  }),

  http.get(`${API_BASE}/dashboard/top-productos`, () => {
    return HttpResponse.json({ data: mockTopProductos });
  }),

  http.get(`${API_BASE}/dashboard/historial-ventas`, ({ request }) => {
    const url = new URL(request.url);
    const periodo = url.searchParams.get('periodo') ?? 'day';
    const validos = ['day', 'week', 'month', 'year'];
    if (!validos.includes(periodo)) {
      return HttpResponse.json(
        { error: `Período inválido: "${periodo}". Use: day, week, month, year` },
        { status: 400 },
      );
    }
    return HttpResponse.json({ data: mockHistorialVentas[periodo] });
  }),
];

// ─── Inventario ───
export const inventarioHandlers = [
  http.get(`${API_BASE}/compras`, () => {
    return HttpResponse.json({ data: [] });
  }),

  http.get(`${API_BASE}/compras/:id`, ({ params }) => {
    return HttpResponse.json({ data: { id: params.id, proveedor: 'Test', costo_total: 0, creado_en: new Date().toISOString(), items: [] } });
  }),

  http.post(`${API_BASE}/compras`, async ({ request }) => {
    return HttpResponse.json({ data: { id: 'compra-1', proveedor: 'Test', costo_total: 0, creado_en: new Date().toISOString(), items: [] } }, { status: 201 });
  }),

  http.get(`${API_BASE}/inventario/movimientos`, () => {
    return HttpResponse.json({ data: [] });
  }),

  http.get(`${API_BASE}/inventario/alertas`, () => {
    return HttpResponse.json({
      data: [
        {
          variante_id: 'var-3',
          sku: 'JW-001',
          producto_nombre: 'Whisky Johnnie Walker',
          variante_nombre: 'Botella 750ml',
          stock: 3,
          stock_minimo: 5,
        },
      ],
    });
  }),
];

// ─── Admin ───
export const adminHandlers = [
  http.get(`${API_BASE}/admin/usuarios/pendientes`, () => {
    return HttpResponse.json({ usuarios: [] });
  }),

  http.patch(`${API_BASE}/admin/usuarios/:id/estado`, async ({ request }) => {
    return HttpResponse.json({ mensaje: 'Usuario actualizado' });
  }),
];

// ─── Combined handlers ───
export const handlers = [
  ...authHandlers,
  ...catalogoHandlers,
  ...mesasHandlers,
  ...sesionesHandlers,
  ...dashboardHandlers,
  ...inventarioHandlers,
  ...adminHandlers,
];
