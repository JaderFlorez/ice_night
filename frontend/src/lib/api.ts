const API_BASE = '/api';

async function getHeaders(): Promise<HeadersInit> {
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export interface UsuarioDTO {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'mesero';
  estado: 'pendiente' | 'activo' | 'rechazado';
  created_at: string;
}

export async function fetchPerfil(): Promise<UsuarioDTO> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/auth/perfil`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(err.error || 'Error al obtener perfil');
  }
  return res.json();
}

export async function fetchPendientes(): Promise<{ usuarios: UsuarioDTO[] }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/admin/usuarios/pendientes`, { headers });
  if (!res.ok) throw new Error('Error al obtener pendientes');
  return res.json();
}

export async function aprobarUsuario(id: string, estado: 'activo' | 'rechazado'): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/admin/usuarios/${id}/estado`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error('Error al actualizar usuario');
}
