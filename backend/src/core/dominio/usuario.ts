export type Rol = 'admin' | 'mesero';
export type EstadoUsuario = 'pendiente' | 'activo' | 'rechazado';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  estado: EstadoUsuario;
  created_at: string;
}
