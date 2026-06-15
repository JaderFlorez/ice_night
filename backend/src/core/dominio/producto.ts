export type Categoria =
  | 'cerveza'
  | 'michelada'
  | 'soda'
  | 'snack'
  | 'otro';

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: Categoria;
  tiene_variantes: boolean;
  activo: boolean;
  created_at: string;
}

export interface ProductoConVariantes extends Producto {
  variantes: import('./variante.js').Variante[];
}
