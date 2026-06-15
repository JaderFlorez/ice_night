# Tasks: Inventory Module

## Phase 1 — Backend (PR #1 ~300 lines)

### Domain Layer
- [x] 1.1 Add `CompraNoEncontrada` error to `core/dominio/errores.ts`

### Application Layer — Use Cases
- [x] 1.2 Create `core/aplicacion/inventario/RegistrarCompra.ts`
  - [x] Accept `RegistrarCompraDTO` (RegistrarCompraSchema)
  - [x] BEGIN TX via pool.query('BEGIN')
  - [x] INSERT compra (generate UUID, set costo_total initially to calculated sum)
  - [x] For each item: INSERT into `items_compra`, UPDATE variantes SET stock = stock + cantidad, INSERT movimiento_stock with tipo='compra'
  - [x] Calculate costo_total = SUM(cantidad * costo_unitario)
  - [x] UPDATE compra SET costo_total
  - [x] COMMIT on success, ROLLBACK on any error
  - [x] Return the created CompraConItems

- [x] 1.3 Create `core/aplicacion/inventario/ListarCompras.ts`
  - [x] Call `compraRepo.findAll()` (with items populated)
  - [x] Return array of CompraConItems

- [x] 1.4 Create `core/aplicacion/inventario/ObtenerCompra.ts`
  - [x] Accept compra_id, call `compraRepo.findById()`
  - [x] Throw `CompraNoEncontrada` if null
  - [x] Return CompraConItems

- [x] 1.5 Create `core/aplicacion/inventario/ListarMovimientosStock.ts`
  - [x] Accept variante_id (query param)
  - [x] Call `movimientoStockRepo.findByVariante(varianteId)`
  - [x] Return array of MovimientoStock

- [x] 1.6 Create `core/aplicacion/inventario/ObtenerAlertasStock.ts`
  - [x] Query all variantes where stock <= stock_minimo AND activa = true
  - [x] Return alerts with producto info for context

### Infrastructure Layer
- [x] 1.7 Create `infraestructura/repositorios/compra-repositorio.ts`
  - [x] Implement `CompraRepositorio` interface
  - [x] `findAll()`: batch query compras + items_compra, return compras with items array embedded
  - [x] `findById()`: same JOIN with WHERE compra_id
  - [x] `save()`: INSERT compra row, return id
  - [x] TX operations handled at use case level via raw SQL (client.query), matching CerrarSesion pattern

### Presentation Layer
- [x] 1.8 Create `presentacion/controladores/inventario.ts`
  - [x] `listarComprasHandler` → GET /api/compras
  - [x] `obtenerCompraHandler` → GET /api/compras/:id
  - [x] `registrarCompraHandler` → POST /api/compras (validate with RegistrarCompraSchema)
  - [x] `listarMovimientosHandler` → GET /api/inventario/movimientos?variante_id=
  - [x] `obtenerAlertasHandler` → GET /api/inventario/alertas

- [x] 1.9 Create `presentacion/rutas/inventario.ts`
  - [x] GET /api/compras — [auth, autorizacion, admin]
  - [x] GET /api/compras/:id — [auth, autorizacion, admin]
  - [x] POST /api/compras — [auth, autorizacion, admin]
  - [x] GET /api/inventario/movimientos — [auth, autorizacion]
  - [x] GET /api/inventario/alertas — [auth, autorizacion]

- [x] 1.10 Modify `presentacion/rutas/index.ts`
  - [x] Import and register inventario routes

### Tests
- [x] 1.11 Add auth guard tests for new endpoints
  - [x] Unauthenticated → 401 on all 5 endpoints
  - [ ] ~~Non-admin → 403 on POST /api/compras, GET /api/compras~~ (integration — needs DB + real token)
  - [ ] ~~Auth-only endpoints (movimientos, alertas) → 200 for non-admin~~ (integration — needs DB + real token)
  - [ ] ~~Valid admin request → 200~~ (integration — needs DB + real token)

---

## Phase 2 — Frontend (PR #2 ~300 lines)

### API Client
- [x] 2.1 Add inventory types to `frontend/src/lib/api.ts`
  - [x] `CompraDTO`, `ItemCompraDTO`, `MovimientoStockDTO`, `AlertaStockDTO` interfaces
  - [x] `RegistrarCompraData` input type

- [x] 2.2 Add inventory API functions to `frontend/src/lib/api.ts`
  - [x] `fetchCompras(): Promise<CompraDTO[]>`
  - [x] `fetchCompra(id): Promise<CompraDTO>`
  - [x] `registrarCompra(data): Promise<CompraDTO>`
  - [x] `fetchMovimientos(varianteId): Promise<MovimientoStockDTO[]>`
  - [x] `fetchAlertas(): Promise<AlertaStockDTO[]>`

### Pages & Components
- [x] 2.3 Create `frontend/src/pages/inventario/ComprasPage.tsx`
  - [x] List all compras with date, proveedor, costo_total
  - [x] Click row to expand items (variante name, cantidad, costo_unitario)
  - [x] "Nueva compra" button opens RegistrarCompraModal

- [x] 2.4 Create `frontend/src/components/inventario/RegistrarCompraModal.tsx`
  - [x] Select variant from catalog (search/fetch productos with variantes)
  - [x] For each item: variante selector, cantidad field, costo_unitario field
  - [x] Add/remove items dynamically (min 1)
  - [x] Optional: proveedor field, notas field
  - [x] Submit → registrarCompra → close modal → refresh list

- [x] 2.5 Create `frontend/src/components/inventario/AlertasStock.tsx`
  - [x] Fetch alertas on mount
  - [x] Display list of variants with stock_minimo, current stock (red badge if below)
  - [x] Could be sidebar component or inventory page section

- [x] 2.6 Modify `frontend/src/App.tsx`
  - [x] Add route: `/inventario/compras` → ComprasPage
  - [x] Guard with ProtectedRoute + AdminRoute where appropriate
