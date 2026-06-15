export interface Compra {
  id: string;
  proveedor?: string;
  notas?: string;
  costo_total: number;
  creado_en: string;
}

export interface ItemCompra {
  id: string;
  compra_id: string;
  variante_id: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
}
