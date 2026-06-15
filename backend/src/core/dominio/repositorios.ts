import { Usuario } from './usuario.js';
import { Producto } from './producto.js';
import { Variante } from './variante.js';
import { Mesa } from './mesa.js';
import { Sesion, ItemSesion } from './sesion.js';
import { Compra, ItemCompra } from './compra.js';
import { MovimientoStock } from './movimiento-stock.js';

export interface UsuarioRepositorio {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  save(usuario: Usuario): Promise<void>;
  updateEstado(id: string, estado: Usuario['estado']): Promise<void>;
  listPendientes(): Promise<Usuario[]>;
}

export interface ProductoRepositorio {
  findAll(): Promise<Producto[]>;
  findById(id: string): Promise<Producto | null>;
  save(producto: Producto): Promise<void>;
  update(producto: Producto): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface VarianteRepositorio {
  findByProducto(productoId: string): Promise<Variante[]>;
  findById(id: string): Promise<Variante | null>;
  save(variante: Variante): Promise<void>;
  update(variante: Variante): Promise<void>;
  updateStock(id: string, cantidad: number): Promise<void>;
}

export interface MesaRepositorio {
  findAll(): Promise<Mesa[]>;
  findById(id: string): Promise<Mesa | null>;
  save(mesa: Mesa): Promise<void>;
  updateEstado(id: string, activa: boolean): Promise<void>;
}

export interface SesionRepositorio {
  findById(id: string): Promise<Sesion | null>;
  findByMesaAbierta(mesaId: string): Promise<Sesion | null>;
  save(sesion: Sesion): Promise<void>;
  update(sesion: Sesion): Promise<void>;
  cerrar(
    id: string,
    total: number,
    metodoPago?: string,
  ): Promise<void>;
}

export interface ItemSesionRepositorio {
  findBySesion(sesionId: string): Promise<ItemSesion[]>;
  save(item: ItemSesion): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CompraRepositorio {
  findAll(): Promise<Compra[]>;
  findById(id: string): Promise<Compra | null>;
  save(compra: Compra): Promise<void>;
}

export interface MovimientoStockRepositorio {
  findByVariante(varianteId: string): Promise<MovimientoStock[]>;
  save(movimiento: MovimientoStock): Promise<void>;
}
