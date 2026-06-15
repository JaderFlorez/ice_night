export interface Variante {
  id: string;
  producto_id: string;
  nombre: string;
  sku: string;
  precio: number;
  costo: number;
  stock: number;
  stock_minimo: number;
  activa: boolean;
  created_at: string;
}
