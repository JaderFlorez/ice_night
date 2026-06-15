import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchPerfil } from '../../lib/api';

export function PendingApprovalPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('Esperando aprobación del administrador...');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const perfil = await fetchPerfil();
        if (perfil.estado === 'activo') {
          navigate('/dashboard', { replace: true });
        } else if (perfil.estado === 'rechazado') {
          setMensaje('Tu cuenta fue rechazada. Contactá al administrador.');
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="animate-pulse mb-6">
          <div className="mx-auto w-16 h-16 bg-purple-600/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          Cuenta pendiente de aprobación
        </h1>

        <p className="text-gray-400 mb-6">
          {mensaje}
        </p>

        <p className="text-gray-600 text-sm mb-8">
          Serás redirigido automáticamente cuando el administrador te apruebe.
        </p>

        <button
          onClick={signOut}
          className="text-gray-500 hover:text-gray-300 text-sm underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
