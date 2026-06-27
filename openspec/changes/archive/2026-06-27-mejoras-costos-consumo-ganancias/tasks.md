# Tasks: Mejoras Costos, Consumo y Ganancias

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1: Domain & Infrastructure

- [x] **1.1** `repositorios.ts` — add `update(id, Partial<ItemSesion>): Promise<void>` to `ItemSesionRepositorio`
- [x] **1.2** `item-sesion-repositorio.ts` — implement `update()`: `UPDATE items_sesion SET cantidad = $1, subtotal = $2 WHERE id = $3`, don't touch `creado_en`

## Phase 2: Application — Backend Use Cases & Schemas

- [x] **2.1** `dto.ts` — add `costo?: z.number().min(0).optional()` to `CrearProductoSchema` and `ActualizarProductoSchema`
- [x] **2.2** `CrearProducto.ts` — change `costo: 0` to `costo: data.costo ?? 0`
- [x] **2.3** `dto.ts` — add `ActualizarItemSchema` with `cantidad: z.number().int().positive()`
- [x] **2.4** `ActualizarConsumo.ts` — new file: `ejecutar(sesionId, itemId, cantidad)` — validate session exists + open, validate item belongs to session, recalc subtotal, call `itemRepo.update()`
- [x] **2.5** `ObtenerHistorialVentas.ts` — add `LEFT JOIN variantes ON items_sesion.variante_id = variantes.id`, `SUM(items_sesion.cantidad * COALESCE(variantes.costo, 0))` as `costo_total`. Extend DTOs with `total_costos`, `utilidad`, and per-period `costo`/`utilidad`

## Phase 3: Presentation — Backend Routes

- [x] **3.1** `controladores/sesiones.ts` — add `actualizarConsumo` handler: parse body with `ActualizarItemSchema`, invoke use case, return 200/404/409
- [x] **3.2** `rutas/sesiones.ts` — add `PATCH /api/sesiones/:sesionId/items/:itemId` with auth + tenant middleware

## Phase 4: Frontend — API Layer

- [x] **4.1** `api.ts` — add `costo?: number` to `CrearProductoData` and `ActualizarProductoData`
- [x] **4.2** `api.ts` — add `actualizarConsumo(sesionId, itemId, cantidad)` function and `ActualizarConsumoData` type
- [x] **4.3** `api.ts` — extend `HistorialVentasDTO` with `total_costos`, `utilidad`; extend `HistorialVentaDetalleDTO` with `costo`, `utilidad`

## Phase 5: Frontend — UI Components

- [x] **5.1** `ProductFormModal.tsx` — add "Costo unitario" input between precio and stock, shown only when `!tieneVariantes`
- [x] **5.2** `SesionPage.tsx` — add "Editar" button per row (open session only); inline `<input type="number">` for cantidad; Guardar/Cancelar; call `actualizarConsumo()`; refresh cuenta on success
- [x] **5.3** `SalesHistorySection.tsx` — add "Costo total" and "Utilidad" KPI cards; add `costo` and `utilidad` columns to desglose table with COP formatting

## Phase 6: Testing

| # | What | Approach |
|---|------|----------|
| 6.1 | Unit: `CrearProducto` con/sin costo | Mock repos, assert variante.precio_compra |
| 6.2 | Unit: `ActualizarConsumo` — no encontrada, cerrada, item inválido, éxito con subtotal recalculado | Mock repos, assert update called |
| 6.3 | Unit/Int: `ObtenerHistorialVentas` returns `total_costos` + `utilidad` | app.inject or DB test |
| 6.4 | Integration: `PATCH /api/sesiones/:id/items/:itemId` full flow | app.inject with DB |
| 6.5 | Integration: `GET /api/dashboard/historial-ventas` returns new fields | app.inject with DB |
| 6.6 | Frontend: `ProductFormModal` renders costo input when `!tieneVariantes` | RTL component test |
| 6.7 | Frontend: `SesionPage` edit button → inline input → calls PATCH | RTL + mocked fetch |
| 6.8 | Frontend: `SalesHistorySection` renders new KPIs + columns | RTL + mocked data |
