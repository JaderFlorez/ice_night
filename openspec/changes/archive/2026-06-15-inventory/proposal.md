# Proposal: Inventory Module — ICE NIGHT ERP

## Intent

Purchase tracking and stock control. Admins register purchases (compras) that auto-update variant stock and log movements. Low-stock alerts for reordering.

## Scope

### In Scope
- PR #1 Backend: CompraRepositorioImpl, 5 use cases (TX-based RegistrarCompra), 5 endpoints, tests
- PR #2 Frontend: API client, ComprasPage, RegistrarCompraModal, AlertasStock component

### Out of Scope
- Edit/delete purchases, supplier CRUD, purchase returns, dashboard/reports

## Capabilities

> `openspec/specs/` empty — no existing capability specs.

### New Capabilities
- `inventory-purchases`: Purchase registration (TX across compra + items + stock update + movement log), list/fetch compras
- `inventory-stock`: Movement log by variant, low-stock alerts (stock <= stock_minimo)

### Modified Capabilities
None — no existing specs affected.

## Approach

Clean Architecture: Domain entities + repos already scaffolded (CompraRepositorio interface, MovimientoStockRepositorioImpl exists). New CompraRepositorioImpl. Use cases under `aplicacion/inventario/`. TX flow: BEGIN → INSERT compra → INSERT items → UPDATE stock (VarianteRepositorio.updateStock) → INSERT movimiento_stock per item → calc costo_total → COMMIT | ROLLBACK. Controllers in `controladores/inventario.ts`, routes in `rutas/inventario.ts`. Frontend follows existing api.ts pattern.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `core/aplicacion/inventario/` | New | 5 use cases: RegistrarCompra, ListarCompras, ObtenerCompra, ListarMovimientosStock, ObtenerAlertasStock |
| `infraestructura/repositorios/compra-repositorio.ts` | New | CompraRepositorioImpl |
| `presentacion/controladores/inventario.ts` | New | 5 handlers |
| `presentacion/rutas/inventario.ts` | New | 5 routes |
| `presentacion/rutas/index.ts` | Modified | Register inventario routes |
| `core/dominio/errores.ts` | Modified | Add `CompraNoEncontrada` |
| `frontend/src/lib/api.ts` | Modified | Add 5 inventory API functions |
| `frontend/src/pages/inventario/` | New | ComprasPage, AlertasStock |
| `frontend/src/components/inventario/` | New | RegistrarCompraModal |
| `frontend/src/App.tsx` | Modified | Add `/inventario/compras` route |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TX partial failure (compra OK, items fail) | Low | BEGIN/COMMIT/ROLLBACK in use case |
| Double-stock update on retry | Low | UUID PK — re-insert fails cleanly |
| Alert query perf with many variants | Low | stock_minimo is single indexed column |

## Rollback Plan

Revert PR#2 then PR#1. No schema changes — uses existing migrations. Git revert sufficient.

## Dependencies

- Auth middleware chain (authMiddleware, autorizacionMiddleware, adminMiddleware)
- `VarianteRepositorio.updateStock(id, cantidad)` exists in variante-repositorio.ts
- `MovimientoStockRepositorioImpl` exists
- Existing `compras`, `items_compra`, `movimientos_stock` tables (00005_inventario.sql)

## Success Criteria

- [ ] POST /api/compras TX creates compra + items + updates stock + logs movements
- [ ] Failed TX (bad variante_id) rolls back — no orphan compra or stock change
- [ ] GET /api/compras returns purchases with embedded items
- [ ] GET /api/inventario/alertas returns variants where stock <= stock_minimo
- [ ] Frontend can list purchases, register compra, see stock alerts
- [ ] tsc --noEmit passes 0 errors; npm test passes
