import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { DashboardPage } from '../pages/DashboardPage';
import type {
  DashboardHoyDTO,
  TopProductoDTO,
  HistorialVentasDTO,
} from '../lib/api';

// ─── Mutable targets for vi.mock factories (SOLUTION: module-level mutable vars) ───
let _mockDashboardHoy: () => Promise<DashboardHoyDTO>;
let _mockTopProductos: () => Promise<TopProductoDTO[]>;
let _mockFetchHistorialVentas: () => Promise<HistorialVentasDTO>;

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    fetchDashboardHoy: () => _mockDashboardHoy(),
    fetchTopProductos: () => _mockTopProductos(),
    fetchHistorialVentas: () => _mockFetchHistorialVentas(),
  };
});

vi.mock('../context/AuthContext', () => {
  const mockPerfil = {
    id: 'user-1',
    email: 'admin@icenight.com',
    nombre: 'Admin',
    rol: 'admin' as const,
    estado: 'activo' as const,
    created_at: '2025-01-01T00:00:00Z',
  };
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
      session: { access_token: 'mock-token', user: { id: 'user-1' } },
      perfil: mockPerfil,
      loading: false,
      signOut: vi.fn().mockResolvedValue(undefined),
    }),
    useIsAdmin: () => true,
    useRol: () => 'admin',
  };
});

const defaultDashboardHoy: DashboardHoyDTO = {
  ventas: { total_sesiones: 15, sesiones_activas: 3, total_recaudado: 450000 },
  mesas: { total: 10, activas: 3 },
  alertas: 2,
};

const defaultHistorialVentas: HistorialVentasDTO = {
  periodo: 'day',
  total_sesiones: 8,
  total_recaudado: 245000,
  productos_vendidos: 34,
  desglose: [
    { fecha: '2026-06-24 10:00:00', sesiones: 2, total: 45000 },
    { fecha: '2026-06-24 14:00:00', sesiones: 3, total: 85000 },
  ],
};

const defaultTopProductos: TopProductoDTO[] = [
  {
    variante_id: 'var-1',
    sku: 'AGL-001',
    producto_nombre: 'Aguila light',
    variante_nombre: 'Botella 330ml',
    total_vendido: 25,
    total_recaudado: 87500,
  },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _mockDashboardHoy = vi.fn().mockResolvedValue(defaultDashboardHoy);
    _mockTopProductos = vi.fn().mockResolvedValue(defaultTopProductos);
    _mockFetchHistorialVentas = vi.fn().mockResolvedValue(defaultHistorialVentas);
  });

  it('shows loading state initially', () => {
    _mockDashboardHoy = vi.fn().mockReturnValue(new Promise(() => {}));
    _mockTopProductos = vi.fn().mockReturnValue(new Promise(() => {}));

    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });
    expect(screen.getByText('Cargando dashboard...')).toBeInTheDocument();
  });

  it('renders welcome message with user name', async () => {
    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Bienvenido/ })).toBeInTheDocument();
    });
    expect(screen.getByText(/admin@icenight\.com/)).toBeInTheDocument();
  });

  it('renders all KPI cards with data', async () => {
    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('Total recaudado hoy')).toBeInTheDocument();
    });

    // Currency: toFixed(2) format
    expect(screen.getByText('$450000.00')).toBeInTheDocument();
    expect(screen.getByText(/15 sesiones/)).toBeInTheDocument();
    expect(screen.getByText('Sesiones activas')).toBeInTheDocument();
    // "3" appears twice: Sesiones activas count + Mesas activas count
    expect(screen.getAllByText('3')).toHaveLength(2);
    // "Alertas de stock" appears twice: <p> in KPI + <h3> in alerts section
    expect(screen.getAllByText('Alertas de stock')).toHaveLength(2);
    expect(screen.getByText('Mesas activas')).toBeInTheDocument();
    expect(screen.getByText(/10 mesas en total/)).toBeInTheDocument();
  });

  it('renders top products table', async () => {
    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('Top 5 productos hoy')).toBeInTheDocument();
    });

    expect(screen.getByText('Aguila light')).toBeInTheDocument();
    expect(screen.getByText('$87500.00')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    _mockDashboardHoy = vi.fn().mockRejectedValue(new Error('Error de conexión'));
    _mockTopProductos = vi.fn().mockRejectedValue(new Error('Error de conexión'));

    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });
  });

  it('shows empty state when no top products', async () => {
    _mockTopProductos = vi.fn().mockResolvedValue([]);

    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('No hay ventas cerradas hoy')).toBeInTheDocument();
    });
  });

  it('shows historial section title', async () => {
    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('Historial de ventas')).toBeInTheDocument();
    });
  });

  it('renders historial KPIs with day data by default', async () => {
    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('Total sesiones')).toBeInTheDocument();
    });

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('$245000.00')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
  });

  it('renders historial detail table with day entries', async () => {
    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('2026-06-24 10:00:00')).toBeInTheDocument();
    });

    expect(screen.getByText('2026-06-24 14:00:00')).toBeInTheDocument();
  });

  it('calls fetchHistorialVentas on mount', async () => {
    renderWithProviders(<DashboardPage />, { initialRoute: '/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('Historial de ventas')).toBeInTheDocument();
    });

    expect(_mockFetchHistorialVentas).toHaveBeenCalledTimes(1);
  });
});
