import { Variante } from './variante.js';

export type EstadoSesion = 'abierta' | 'cerrada';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Sesion {
  id: string;
  mesa_id: string;
  mesero_id: string;
  estado: EstadoSesion;
  abierta_en: string;
  cerrada_en?: string;
  metodo_pago?: MetodoPago;
  total?: number;
}

export interface ItemSesion {
  id: string;
  sesion_id: string;
  variante_id: string;
  variante_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  creado_en: string;
}
