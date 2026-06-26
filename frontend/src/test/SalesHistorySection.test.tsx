import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from './test-utils';
import { SalesHistorySection } from '../components/dashboard/SalesHistorySection';
import { server } from './msw/server';

// MSW is set up globally in setup.ts — no vi.mock needed for api.
// The handler for GET /api/dashboard/historial-ventas is already configured
// in handlers.ts returning mock data per period.

describe('SalesHistorySection', () => {
  beforeEach(() => {
    // Don't call vi.restoreAllMocks — MSW handlers are reset by
    // afterEach(() => server.resetHandlers()) in setup.ts. The api module
    // is NOT mocked here; we use real imports + MSW.
  });

  it('shows loading state initially', () => {
    renderWithProviders(<SalesHistorySection />);

    expect(screen.getByText('Cargando historial...')).toBeInTheDocument();
  });

  it('renders KPIs and table after data loads', async () => {
    renderWithProviders(<SalesHistorySection />);

    // Wait for conditionally-rendered KPI text (not the always-present heading)
    await waitFor(() => {
      expect(screen.getByText('Total sesiones')).toBeInTheDocument();
    });

    // KPI values (day mock: total_sesiones=8, total_recaudado=245000, productos_vendidos=34)
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/245\.000/)).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
  });

  it('shows "day" data by default', async () => {
    renderWithProviders(<SalesHistorySection />);

    await waitFor(() => {
      expect(screen.getByText('Total sesiones')).toBeInTheDocument();
    });

    // Day button should be active (purple)
    const dayButton = screen.getByText('Día');
    expect(dayButton.className).toContain('bg-purple-600');

    // Day mock has 3 desglose entries
    expect(screen.getByText('2026-06-24 10:00:00')).toBeInTheDocument();
    expect(screen.getByText('2026-06-24 14:00:00')).toBeInTheDocument();
    expect(screen.getByText('2026-06-24 18:00:00')).toBeInTheDocument();
  });

  it('changes data when clicking week button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SalesHistorySection />);

    // Wait for initial day data to load
    await waitFor(() => {
      expect(screen.getByText('Total sesiones')).toBeInTheDocument();
    });

    // Click "Semana" button
    await user.click(screen.getByText('Semana'));

    // Week mock: total_sesiones=45, total_recaudado=1250000
    await waitFor(() => {
      expect(screen.getByText(/1\.250\.000/)).toBeInTheDocument();
    });

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();

    // Week button should now be active
    const weekButton = screen.getByText('Semana');
    expect(weekButton.className).toContain('bg-purple-600');

    // Day button should no longer be active
    const dayButton = screen.getByText('Día');
    expect(dayButton.className).not.toContain('bg-purple-600');
  });

  it('renders month and year data correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SalesHistorySection />);

    await waitFor(() => {
      expect(screen.getByText('Total sesiones')).toBeInTheDocument();
    });

    // Click "Mes"
    await user.click(screen.getByText('Mes'));

    await waitFor(() => {
      expect(screen.getByText(/5\.200\.000/)).toBeInTheDocument();
    });

    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('1400')).toBeInTheDocument();

    // Month mock has 4 entries
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    expect(screen.getByText('2026-06-22')).toBeInTheDocument();

    // Click "Año"
    await user.click(screen.getByText('Año'));

    await waitFor(() => {
      expect(screen.getByText(/58\.000\.000/)).toBeInTheDocument();
    });

    expect(screen.getByText('2100')).toBeInTheDocument();
    expect(screen.getByText('16800')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    // Override MSW handler to return 500 for this test
    server.use(
      http.get('/api/dashboard/historial-ventas', () => {
        return HttpResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<SalesHistorySection />);

    await waitFor(() => {
      expect(
        screen.getByText('Error interno del servidor'),
      ).toBeInTheDocument();
    });
  });
});
