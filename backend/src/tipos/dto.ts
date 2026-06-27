import { z } from 'zod';

// ─── Auth ───
export const RegistroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre: z.string().min(1, 'Nombre requerido'),
});
export type RegistroDTO = z.infer<typeof RegistroSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});
export type LoginDTO = z.infer<typeof LoginSchema>;

// ─── Productos ───
export const CrearProductoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  categoria: z.enum(['cerveza', 'vino', 'licor', 'whisky', 'vodka', 'ron', 'gin', 'energizante', 'gaseosa', 'agua', 'snack', 'otro']),
  tiene_variantes: z.boolean().default(false),
  precio: z.number().positive('Precio debe ser positivo').optional(),
  costo: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0).optional(),
});
export type CrearProductoDTO = z.infer<typeof CrearProductoSchema>;

export const ActualizarProductoSchema = CrearProductoSchema.partial();
export type ActualizarProductoDTO = z.infer<typeof ActualizarProductoSchema>;

export const CrearVarianteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  sku: z.string().min(1, 'SKU requerido'),
  precio: z.number().positive('Precio debe ser positivo'),
  costo: z.number().min(0, 'Costo no puede ser negativo'),
  stock: z.number().int().min(0).default(0),
  stock_minimo: z.number().int().min(0).default(5),
});
export type CrearVarianteDTO = z.infer<typeof CrearVarianteSchema>;

export const ActualizarVarianteSchema = CrearVarianteSchema.partial();
export type ActualizarVarianteDTO = z.infer<typeof ActualizarVarianteSchema>;

// ─── Mesas ───
export const CrearMesaSchema = z.object({
  numero: z.number().int().positive(),
  capacidad: z.number().int().positive().default(4),
  ubicacion: z.string().optional(),
});
export type CrearMesaDTO = z.infer<typeof CrearMesaSchema>;

export const ActualizarMesaSchema = CrearMesaSchema.partial();
export type ActualizarMesaDTO = z.infer<typeof ActualizarMesaSchema>;

// ─── Sesiones ───
export const AgregarItemSchema = z.object({
  variante_id: z.string().uuid(),
  cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
});
export type AgregarItemDTO = z.infer<typeof AgregarItemSchema>;

export const CerrarSesionSchema = z.object({
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
});
export type CerrarSesionDTO = z.infer<typeof CerrarSesionSchema>;

export const ActualizarItemSchema = z.object({
  cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
});
export type ActualizarItemDTO = z.infer<typeof ActualizarItemSchema>;

// ─── Compras ───
export const ItemCompraSchema = z.object({
  variante_id: z.string().uuid(),
  cantidad: z.number().int().positive(),
  costo_unitario: z.number().min(0),
});

export const RegistrarCompraSchema = z.object({
  proveedor: z.string().optional(),
  notas: z.string().optional(),
  items: z.array(ItemCompraSchema).min(1, 'Debe tener al menos un item'),
});
export type RegistrarCompraDTO = z.infer<typeof RegistrarCompraSchema>;

// ─── Usuarios ───
export const AprobarUsuarioSchema = z.object({
  estado: z.enum(['activo', 'rechazado']),
});
export type AprobarUsuarioDTO = z.infer<typeof AprobarUsuarioSchema>;

// ─── Respuestas ───
export interface ErrorResponse {
  error: string;
  detalles?: string[];
}

export interface SuccessResponse<T = unknown> {
  data: T;
  mensaje?: string;
}
