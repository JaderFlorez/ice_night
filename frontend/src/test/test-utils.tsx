import { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import type { UsuarioDTO } from '../lib/api';

// ─── Factory helpers (pure data, no vi.mock) ───
export function makeAdminPerfil(overrides?: Partial<UsuarioDTO>): UsuarioDTO {
  return {
    id: 'user-1',
    email: 'admin@icenight.com',
    nombre: 'Admin',
    rol: 'admin',
    estado: 'activo',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeMeseroPerfil(overrides?: Partial<UsuarioDTO>): UsuarioDTO {
  return {
    id: 'user-2',
    email: 'mesero@icenight.com',
    nombre: 'Mesero',
    rol: 'mesero',
    estado: 'activo',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── Wrapper for component tests ───
interface WrapperOptions {
  initialRoute?: string;
  routes?: Array<{ path: string; element: ReactNode }>;
}

export function renderWithProviders(
  ui: ReactNode,
  options?: WrapperOptions & Omit<RenderOptions, 'wrapper'>,
) {
  const { initialRoute = '/', routes, ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: ReactNode }) {
    if (routes) {
      return (
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            {routes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
            <Route path="*" element={children} />
          </Routes>
        </MemoryRouter>
      );
    }
    return <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { render } from '@testing-library/react';
