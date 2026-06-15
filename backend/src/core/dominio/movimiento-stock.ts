export type TipoMovimiento = 'compra' | 'venta' | 'ajuste';

export interface MovimientoStock {
  id: string;
  variante_id: string;
  cantidad: number;
  tipo: TipoMovimiento;
  referencia_id?: string;
  creado_en: string;
}
