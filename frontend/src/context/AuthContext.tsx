import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { fetchPerfil, type UsuarioDTO } from '../lib/api';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  perfil: UsuarioDTO | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<UsuarioDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarPerfil = async () => {
    try {
      const perfilData = await fetchPerfil();
      setPerfil(perfilData);
    } catch {
      setPerfil(null);
    }
  };

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession) {
        cargarPerfil().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN' && newSession) {
        await cargarPerfil();
      } else if (event === 'SIGNED_OUT') {
        setPerfil(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPerfil(null);
  };

  return (
    <AuthContext.Provider value={{ session, perfil, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}

export function useIsAdmin(): boolean {
  const { perfil } = useAuth();
  return perfil?.rol === 'admin';
}

export function useRol(): string | undefined {
  return useAuth().perfil?.rol;
}
