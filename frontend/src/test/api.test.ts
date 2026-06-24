import { describe, it, expect } from 'vitest';
import {
  fetchPerfil,
  fetchPendientes,
  aprobarUsuario,
  eliminarProducto,
  abrirSesion,
  fetchProductos,
  fetchProducto,
  crearProducto,
  actualizarProducto,
  crearVariante,
  actualizarVariante,
  eliminarVariante,
  fetchNextSku,
  fetchVariantes,
  fetchMesas,
  crearMesa,
  actualizarMesa,
  eliminarMesa,
  fetchSesionesActivas,
  fetchSesion,
  cerrarSesion,
  agregarConsumo,
  obtenerCuenta,
  eliminarConsumo,
  fetchDashboardHoy,
  fetchTopProductos,
  fetchHistorialVentas,
  fetchCompras,
  fetchCompra,
  registrarCompra,
  fetchMovimientos,
  fetchAlertas,
  type CrearProductoData,
  type ActualizarProductoData,
  type CrearMesaData,
  type AgregarConsumoData,
  type HistorialVentasDTO,
} from '../lib/api';

describe('api.ts — catálogo / productos', () => {
  it('fetchProductos returns products', async () => {
    const productos = await fetchProductos();
    expect(productos).toHaveLength(3);
    expect(productos[0].nombre).toBe('Aguila light');
    expect(productos[0].variantes).toHaveLength(2);
  });

  it('fetchProductos filters by query', async () => {
    const productos = await fetchProductos('whisky');
    expect(productos).toHaveLength(1);
    expect(productos[0].nombre).toContain('Whisky');
  });

  it('fetchProductos filters by category', async () => {
    const productos = await fetchProductos(undefined, 'cerveza');
    expect(productos).toHaveLength(1);
    expect(productos[0].categoria).toBe('cerveza');
  });

  it('fetchProducto returns a single product', async () => {
    const producto = await fetchProducto('prod-1');
    expect(producto.id).toBe('prod-1');
    expect(producto.nombre).toBe('Aguila light');
  });

  it('fetchProducto throws on 404', async () => {
    await expect(fetchProducto('non-existent')).rejects.toThrow('Error al obtener producto');
  });

  it('crearProducto creates a product', async () => {
    const data: CrearProductoData = {
      nombre: 'Nuevo Producto',
      categoria: 'otro',
      tiene_variantes: false,
      precio: 10000,
      stock: 50,
    };
    const producto = await crearProducto(data);
    expect(producto.nombre).toBe('Nuevo Producto');
    expect(producto.id).toBeTruthy();
    // Should auto-create a single variant when tiene_variantes=false
    if (!data.tiene_variantes) {
      expect(producto.variantes).toHaveLength(1);
    }
  });

  it('actualizarProducto updates a product', async () => {
    const data: ActualizarProductoData = { nombre: 'Updated Name' };
    await expect(actualizarProducto('prod-1', data)).resolves.toBeUndefined();
  });

  it('eliminarProducto succeeds for unused product', async () => {
    await expect(eliminarProducto('prod-2')).resolves.toBeUndefined();
  });

  it('eliminarProducto throws FK error for product with history', async () => {
    await expect(eliminarProducto('prod-1')).rejects.toThrow(
      'No se puede eliminar el producto porque tiene registros asociados',
    );
  });

  it('fetchNextSku returns a suggestion', async () => {
    const result = await fetchNextSku('cerveza');
    expect(result.sku).toBeTruthy();
    expect(result.sku).toContain('CER');
  });

  it('fetchVariantes returns variants', async () => {
    const variantes = await fetchVariantes('prod-1');
    expect(variantes).toHaveLength(2);
  });

  it('crearVariante creates a variant', async () => {
    const variant = await crearVariante('prod-1', {
      nombre: 'Nueva Variante',
      sku: 'NV-001',
      precio: 5000,
      stock: 10,
    });
    expect(variant.nombre).toBe('Nueva Variante');
    expect(variant.producto_id).toBe('prod-1');
  });

  it('actualizarVariante updates a variant', async () => {
    await expect(
      actualizarVariante('var-1', { precio: 4000 }),
    ).resolves.toBeUndefined();
  });

  it('eliminarVariante succeeds for unused variant', async () => {
    await expect(eliminarVariante('var-3')).resolves.toBeUndefined();
  });

  it('eliminarVariante throws FK error for used variant', async () => {
    await expect(eliminarVariante('var-1')).rejects.toThrow(
      'No se puede eliminar la variante porque tiene registros asociados',
    );
  });
});

describe('api.ts — mesas', () => {
  it('fetchMesas returns all active tables', async () => {
    const mesas = await fetchMesas();
    expect(mesas).toHaveLength(4);
    expect(mesas[0].numero).toBe(1);
  });

  it('crearMesa creates a table', async () => {
    const data: CrearMesaData = { numero: 10, capacidad: 6, ubicacion: 'Terraza' };
    const mesa = await crearMesa(data);
    expect(mesa.numero).toBe(10);
    expect(mesa.capacidad).toBe(6);
  });

  it('actualizarMesa updates a table', async () => {
    await expect(
      actualizarMesa('mesa-1', { ubicacion: 'Nueva ubicación' }),
    ).resolves.toBeUndefined();
  });

  it('eliminarMesa deletes a table', async () => {
    await expect(eliminarMesa('mesa-4')).resolves.toBeUndefined();
  });
});

describe('api.ts — sesiones', () => {
  it('abrirSesion sends empty body and returns session', async () => {
    const sesion = await abrirSesion('mesa-1');
    expect(sesion.estado).toBe('abierta');
    expect(sesion.mesa_id).toBe('mesa-1');
    expect(sesion.id).toBeTruthy();
  });

  it('fetchSesionesActivas returns active sessions', async () => {
    const sesiones = await fetchSesionesActivas();
    expect(sesiones).toHaveLength(1);
    expect(sesiones[0].estado).toBe('abierta');
  });

  it('fetchSesion returns a session by ID', async () => {
    const sesion = await fetchSesion('sesion-1');
    expect(sesion.id).toBe('sesion-1');
  });

  it('obtenerCuenta returns account with items', async () => {
    const cuenta = await obtenerCuenta('sesion-1');
    expect(cuenta.items).toHaveLength(2);
    expect(cuenta.total).toBe(9500);
  });

  it('agregarConsumo adds an item', async () => {
    const data: AgregarConsumoData = { variante_id: 'var-1', cantidad: 2 };
    const item = await agregarConsumo('sesion-1', data);
    expect(item.cantidad).toBe(2);
  });

  it('eliminarConsumo removes an item', async () => {
    await expect(
      eliminarConsumo('sesion-1', 'item-1'),
    ).resolves.toBeUndefined();
  });

  it('cerrarSesion closes the session', async () => {
    await expect(
      cerrarSesion('sesion-1', 'efectivo'),
    ).resolves.toBeUndefined();
  });
});

describe('api.ts — dashboard', () => {
  it('fetchDashboardHoy returns today stats', async () => {
    const hoy = await fetchDashboardHoy();
    expect(hoy.ventas.total_recaudado).toBe(450000);
    expect(hoy.mesas.activas).toBe(3);
    expect(hoy.alertas).toBe(2);
  });

  it('fetchTopProductos returns top products', async () => {
    const top = await fetchTopProductos();
    expect(top).toHaveLength(2);
    expect(top[0].producto_nombre).toBe('Aguila light');
  });
});

describe('api.ts — dashboard / historial-ventas', () => {
  it('fetchHistorialVentas("day") returns sales history', async () => {
    const data = await fetchHistorialVentas('day');
    expect(data.periodo).toBe('day');
    expect(data.total_sesiones).toBeGreaterThan(0);
    expect(data.total_recaudado).toBeGreaterThan(0);
    expect(data.productos_vendidos).toBeGreaterThan(0);
    expect(data.desglose.length).toBeGreaterThan(0);
    expect(data.desglose[0]).toHaveProperty('fecha');
    expect(data.desglose[0]).toHaveProperty('sesiones');
    expect(data.desglose[0]).toHaveProperty('total');
  });

  it('fetchHistorialVentas("week") returns weekly data', async () => {
    const data = await fetchHistorialVentas('week');
    expect(data.periodo).toBe('week');
    expect(data.desglose.length).toBeGreaterThan(0);
  });

  it('fetchHistorialVentas rejects on server error', async () => {
    await expect(fetchHistorialVentas('invalid')).rejects.toThrow(
      'Período inválido',
    );
  });
});

describe('api.ts — inventario', () => {
  it('fetchCompras returns purchases', async () => {
    const compras = await fetchCompras();
    expect(Array.isArray(compras)).toBe(true);
  });

  it('fetchCompra returns a purchase', async () => {
    const compra = await fetchCompra('compra-1');
    expect(compra.id).toBe('compra-1');
  });

  it('registrarCompra creates a purchase', async () => {
    const compra = await registrarCompra({
      proveedor: 'Distribuidora XYZ',
      items: [{ variante_id: 'var-1', cantidad: 10, costo_unitario: 2000 }],
    });
    expect(compra.id).toBeTruthy();
  });

  it('fetchMovimientos returns movements', async () => {
    const mov = await fetchMovimientos('var-1');
    expect(Array.isArray(mov)).toBe(true);
  });

  it('fetchAlertas returns stock alerts', async () => {
    const alertas = await fetchAlertas();
    expect(alertas).toHaveLength(1);
    expect(alertas[0].sku).toBe('JW-001');
  });
});

describe('api.ts — auth/admin', () => {
  it('fetchPerfil returns user profile', async () => {
    const perfil = await fetchPerfil();
    expect(perfil.email).toBe('admin@icenight.com');
    expect(perfil.rol).toBe('admin');
  });

  it('fetchPendientes returns pending users', async () => {
    const result = await fetchPendientes();
    expect(result.usuarios).toEqual([]);
  });

  it('aprobarUsuario approves a user', async () => {
    await expect(
      aprobarUsuario('user-3', 'activo'),
    ).resolves.toBeUndefined();
  });
});
