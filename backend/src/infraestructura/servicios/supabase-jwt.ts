import { getSupabaseAdmin } from '../db/supabase.js';

export interface DatosUsuarioToken {
  id: string;
  email: string;
}

export async function verificarToken(
  token: string,
): Promise<DatosUsuarioToken | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? '',
  };
}
