# Tasks: Dashboard — ICE NIGHT ERP

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250–350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

## Phase 1: Backend — Application Use Cases (dashboard/)

- [x] **1.1** Create `backend/src/core/aplicacion/dashboard/ObtenerDashboardHoy.ts` — class with injected Pool, `ejecutar()` runs 2 SQL queries (sesiones summary + mesas count), returns `{ ventas: {...}, mesas: {...}, alertas: number }`. Calls `ObtenerAlertasStock().ejecutar()` for alerta count
- [x] **1.2** Create `backend/src/core/aplicacion/dashboard/ObtenerTopProductos.ts` — class with injected Pool, `ejecutar()` runs top-5 SQL, returns `TopProductoDTO[]`
- [ ] **1.3** Create `backend/src/core/aplicacion/dashboard/ObtenerResumenSemanal.ts` — same pattern as `ObtenerDashboardHoy` but with 7-day window, returns array of `{ fecha: string, total_ventas: number, total_sesiones: number }`

## Phase 2: Backend — HTTP Layer (controllers + routes)

- [x] **2.1** Create `backend/src/presentacion/controladores/dashboard.ts` — 3 handlers (`hoyHandler`, `topProductosHandler`, `semanalHandler`), each instantiates its use case with `getPool()`, calls `ejecutar()`, returns `{ data: ... }`. Follows existing controller pattern (try/catch)
- [x] **2.2** Create `backend/src/presentacion/rutas/dashboard.ts` — 3 admin-only routes (`GET /api/dashboard/hoy`, `/top-productos`, `/semanal`) with `[authMiddleware, autorizacionMiddleware, adminMiddleware]` preHandler. Export `registrarRutasDashboard(app)`
- [x] **2.3** Modify `backend/src/presentacion/rutas/index.ts` — import and call `registrarRutasDashboard(app)`

## Phase 3: Frontend — API Client + Types

- [x] **3.1** Add to `frontend/src/lib/api.ts`: `DashboardHoyDTO`, `TopProductoDTO` interfaces, `fetchDashboardHoy()`, `fetchTopProductos()` functions following existing fetch pattern

## Phase 4: Frontend — DashboardPage

- [x] **4.1** Rewrite `frontend/src/pages/DashboardPage.tsx` — fetch `dashboardHoy` and `topProductos` on mount, render 4 KPI cards (total recaudado, sesiones activas, alertas stock with link to /inventario, mesas activas), top-5 productos table, `<AlertasStock />` component, quick links to /mesas /catalogo /inventario/compras

## Phase 5: Tests

- [x] **5.1** Create `backend/test/dashboard.test.ts` — 3 auth guard tests via `app.inject()`: `GET /api/dashboard/hoy` returns 401, `GET /api/dashboard/top-productos` returns 401, `GET /api/dashboard/semanal` returns 401
- [x] **5.2** Verify: `tsc --noEmit` (0 errors), `npm test` (all green), `npm run build` (frontend passes)
