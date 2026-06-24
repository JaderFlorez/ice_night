# Tasks — Tabla de stock y historial de ventas en Dashboard

## Review Workload Forecast

- `400-line budget risk: High`
- `Chained PRs recommended: Yes`
- `Decision needed before apply: Yes`
- Chain strategy: `stacked-to-main`

## PR 1 — Backend endpoint + API types + tests (this PR)

- [x] T-001: Create `ObtenerHistorialVentas` use case
- [x] T-002: Add `historialVentasHandler` in dashboard controller
- [x] T-003: Register `GET /api/dashboard/historial-ventas` route
- [x] T-004: Add `HistorialVentasDTO` types and `fetchHistorialVentas` function in api.ts
- [x] T-005: Add MSW handler for historial-ventas
- [x] T-006: Add frontend tests for `fetchHistorialVentas`
- [x] T-007: Add backend 401 test for historial-ventas endpoint

## PR 2 — Frontend SalesHistorySection component

- [x] Create `SalesHistorySection.tsx` component
- [x] Add KPIs summary card (total_sesiones, total_recaudado, productos_vendidos)
- [x] Add filter buttons (day/week/month/year)
- [x] Add detail table (fecha, sesiones, total)
- [x] Integrate `SalesHistorySection` into `DashboardPage.tsx`
- [x] Tests for `SalesHistorySection` component
- [x] Tests for `DashboardPage` with historial

## PR 3 — Stock table component + integration (future)

- [ ] Create `TablaStock.tsx` component
- [ ] Add search input with debounce
- [ ] Add category filter
- [ ] Integrate `TablaStock` into `InventoryPage.tsx`
- [ ] Tests for `TablaStock` component
- [ ] Tests for `InventoryPage` with stock table
