import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { TablaStock } from '../components/inventario/TablaStock';
import type { ProductoDTO } from '../lib/api';

// ─── Mutable targets for api mocks ───
let _mockFetchProductos: () => Promise<ProductoDTO[]>;

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>(
    '../lib/api',
  );
  return {
    ...actual,
    fetchProductos: () => _mockFetchProductos(),
  };
});

const mockProductos: ProductoDTO[] = [
  {
    id: 'prod-1',
    nombre: 'Aguila light',
    descripcion: null,
    categoria: 'cerveza',
    tiene_variantes: true,
    activo: true,
    creado_en: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-1',
        producto_id: 'prod-1',
        nombre: 'Lata 355ml',
        sku: 'AGL-LATA',
        precio: 1500,
        costo: 800,
        stock: 50,
        stock_minimo: 10,
        activa: true,
      },
      {
        id: 'var-2',
        producto_id: 'prod-1',
        nombre: 'Botella 750ml',
        sku: 'AGL-BOT',
        precio: 3000,
        costo: 1800,
        stock: 5,
        stock_minimo: 10,
        activa: true,
      },
    ],
  },
  {
    id: 'prod-2',
    nombre: 'Whisky Johnnie Walker',
    descripcion: null,
    categoria: 'whisky',
    tiene_variantes: true,
    activo: true,
    creado_en: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-3',
        producto_id: 'prod-2',
        nombre: 'Botella 750ml',
        sku: 'JW-BOT',
        precio: 45000,
        costo: 32000,
        stock: 20,
        stock_minimo: 5,
        activa: true,
      },
    ],
  },
  {
    id: 'prod-3',
    nombre: 'Gaseosa Coca-Cola',
    descripcion: null,
    categoria: 'gaseosa',
    tiene_variantes: true,
    activo: true,
    creado_en: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-4',
        producto_id: 'prod-3',
        nombre: 'Lata 355ml',
        sku: 'COLA-LATA',
        precio: 1200,
        costo: 600,
        stock: 100,
        stock_minimo: 20,
        activa: true,
      },
    ],
  },
  // Inactive product — should NOT appear in rows
  {
    id: 'prod-4',
    nombre: 'Red Label',
    descripcion: null,
    categoria: 'whisky',
    tiene_variantes: true,
    activo: false,
    creado_en: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-5',
        producto_id: 'prod-4',
        nombre: 'Botella 750ml',
        sku: 'RL-BOT',
        precio: 40000,
        costo: 28000,
        stock: 10,
        stock_minimo: 5,
        activa: true,
      },
    ],
  },
  // Product with inactive variant — should NOT appear
  {
    id: 'prod-5',
    nombre: 'Producto Inactivo Var',
    descripcion: null,
    categoria: 'otro',
    tiene_variantes: true,
    activo: true,
    creado_en: '2025-01-01T00:00:00Z',
    variantes: [
      {
        id: 'var-6',
        producto_id: 'prod-5',
        nombre: 'Variante Inactiva',
        sku: 'INACTIVE',
        precio: 100,
        costo: 50,
        stock: 5,
        stock_minimo: 2,
        activa: false,
      },
    ],
  },
];

// Helper: wait until at least one cell with text exists (handles duplicates)
async function waitForText(text: string) {
  await waitFor(() => {
    expect(screen.getAllByText(text).length).toBeGreaterThanOrEqual(1);
  });
}

describe('TablaStock', () => {
  beforeEach(() => {
    _mockFetchProductos = vi.fn().mockResolvedValue(mockProductos);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading state initially', () => {
    _mockFetchProductos = vi.fn().mockReturnValue(new Promise(() => {}));
    renderWithProviders(<TablaStock />);
    expect(screen.getByText('Cargando stock...')).toBeInTheDocument();
  });

  it('renders all variant rows after loading', async () => {
    renderWithProviders(<TablaStock />);

    await waitForText('Aguila light');

    // 3 active products with active variants → 4 rows total
    expect(screen.getAllByText('Lata 355ml').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Botella 750ml').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Whisky Johnnie Walker')).toBeInTheDocument();
    expect(screen.getByText('Gaseosa Coca-Cola')).toBeInTheDocument();

    // Inactive product should NOT appear
    expect(screen.queryByText('Red Label')).not.toBeInTheDocument();

    // Inactive variant should NOT appear
    expect(screen.queryByText('Variante Inactiva')).not.toBeInTheDocument();

    // 4 data rows (1 header + 4 body rows in the table)
    const rows = screen.getAllByRole('row');
    // 1 header + 4 data rows
    expect(rows.length).toBe(5);
  });

  it('shows stock bajo indicator in red text', async () => {
    renderWithProviders(<TablaStock />);

    // Wait until data rows appear
    await waitFor(async () => {
      expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(2);
    });

    // var-2 has stock=5 and stock_minimo=10 → should be red
    // There could be multiple cells with "5" (stock_minimo of var-3 is 5)
    const stockCells = screen.getAllByText('5');
    const redStockCells = stockCells.filter(
      (cell) =>
        cell.className.includes('text-red-400') &&
        cell.closest('td')?.matches('td'),
    );
    expect(redStockCells.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by search query with debounce', async () => {
    renderWithProviders(<TablaStock />);

    await waitForText('Aguila light');

    // All 4 rows visible initially
    expect(screen.getAllByText('Lata 355ml').length).toBeGreaterThanOrEqual(1);

    const searchInput = screen.getByPlaceholderText(
      'Buscar por producto...',
    );
    fireEvent.change(searchInput, { target: { value: 'whisky' } });

    // Fast-forward past debounce
    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(
        screen.getByText('Whisky Johnnie Walker'),
      ).toBeInTheDocument();
    });

    // Other products should be gone (Aguila light had 2 occurrences)
    expect(screen.queryAllByText('Aguila light').length).toBe(0);
    expect(screen.queryByText('Gaseosa Coca-Cola')).not.toBeInTheDocument();
  });

  it('filters by category', async () => {
    renderWithProviders(<TablaStock />);

    await waitForText('Aguila light');

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'cerveza' } });

    vi.advanceTimersByTime(400);

    await waitForText('Aguila light');

    expect(screen.getByText('Lata 355ml')).toBeInTheDocument();
    expect(screen.getByText('Botella 750ml')).toBeInTheDocument();
    // Non-cerveza products gone
    expect(
      screen.queryByText('Whisky Johnnie Walker'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Gaseosa Coca-Cola'),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when no products exist', async () => {
    _mockFetchProductos = vi.fn().mockResolvedValue([]);
    renderWithProviders(<TablaStock />);

    await waitFor(() => {
      expect(
        screen.getByText('No hay productos con stock'),
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when filters match nothing', async () => {
    renderWithProviders(<TablaStock />);

    await waitForText('Aguila light');

    const searchInput = screen.getByPlaceholderText(
      'Buscar por producto...',
    );
    fireEvent.change(searchInput, {
      target: { value: 'zzzzznotexist' },
    });

    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No se encontraron productos con los filtros seleccionados',
        ),
      ).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    _mockFetchProductos = vi
      .fn()
      .mockRejectedValue(new Error('Error de conexión'));
    renderWithProviders(<TablaStock />);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });
  });

  it('formats price and cost as currency', async () => {
    renderWithProviders(<TablaStock />);

    await waitForText('Aguila light');

    // Prices formatted with $
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
    expect(screen.getByText(/3\.000/)).toBeInTheDocument();
    expect(screen.getByText(/45\.000/)).toBeInTheDocument();

    // Costs formatted with $
    expect(screen.getByText(/\$\s*800$/)).toBeInTheDocument();
    expect(screen.getByText(/1\.800/)).toBeInTheDocument();
  });

  it('renders category badges', async () => {
    renderWithProviders(<TablaStock />);

    await waitForText('Aguila light');

    // Cerveza appears in the select options AND in badges
    const cervezaBadges = screen
      .getAllByText('Cerveza')
      .filter(
        (el) =>
          el.closest('span')?.className.includes('rounded-full') ?? false,
      );
    expect(cervezaBadges.length).toBeGreaterThanOrEqual(1);

    // Filter by badge spans (not select options)
    const whiskyBadges = screen
      .getAllByText('Whisky')
      .filter(
        (el) =>
          el.closest('span')?.className.includes('rounded-full') ?? false,
      );
    expect(whiskyBadges.length).toBeGreaterThanOrEqual(1);

    const gaseosaBadges = screen
      .getAllByText('Gaseosa')
      .filter(
        (el) =>
          el.closest('span')?.className.includes('rounded-full') ?? false,
      );
    expect(gaseosaBadges.length).toBeGreaterThanOrEqual(1);
  });
});
