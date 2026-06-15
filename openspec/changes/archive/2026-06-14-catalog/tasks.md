# Tasks: Catalog Module — ICE NIGHT ERP

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1300–1400 (PR#1 ~660, PR#2 ~690) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1: Backend → PR #2: Frontend |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: domain + repos + use cases + routes + tests | PR #1 | Base = main; tests included |
| 2 | Frontend: pages + modals + api client + routes | PR #2 | Base = main (independent frontend); depends on PR #1 for API contract |

---

## Phase 1: Domain updates

- [x] **1.1** — Add `ProductoNoEncontrado` to `errores.ts` (follow `VarianteNoEncontrada` pattern)
- [x] **1.2** — Add `delete(id: string): Promise<void>` to `VarianteRepositorio` in `repositorios.ts`
- [x] **1.3** — Add `ActualizarProductoSchema`, `ActualizarVarianteSchema` (partial of each) to `dto.ts`; make `precio` and `stock` optional in `CrearProductoSchema`

## Phase 2: Repository implementations

- [x] **2.1** — Create `producto-repositorio.ts` — `findAll(q?, categoria?)` with ILIKE filter, `findById` JOIN variantes, `save`, `update`, private `mapearProducto` helper
- [x] **2.2** — Create `variante-repositorio.ts` — `findByProducto`, `findById`, `save`, `update`, `delete(id)` soft-delete (activa=false), private `mapearVariante` helper

## Phase 3: Use cases

- [x] **3.1** — `ListarProductos` — optional q/categoria filters, returns Producto[] with variantes embedded
- [x] **3.2** — `ObtenerProducto` — returns producto + variantes, throws `ProductoNoEncontrado`
- [x] **3.3** — `CrearProducto` — saves producto, if `tiene_variantes=false` auto-creates "Único" variant
- [x] **3.4** — `ActualizarProducto` — validates, updates, throws `ProductoNoEncontrado`
- [x] **3.5** — `EliminarProducto` — soft delete (activo=false), throws `ProductoNoEncontrado`
- [x] **3.6** — `ListarVariantes` — by producto_id
- [x] **3.7** — `CrearVariante` — saves, validates SKU uniqueness
- [x] **3.8** — `ActualizarVariante` — validates, updates
- [x] **3.9** — `EliminarVariante` — soft delete (activa=false)
- [x] **3.10** — `SugerirSku` — generates next SKU like `CER-001` from category prefix

## Phase 4: HTTP layer

- [x] **4.1** — Create `controladores/catalogo.ts` — 10 handlers wiring use cases to Fastify req/reply
- [x] **4.2** — Create `rutas/catalogo.ts` — 10 routes with middleware: GET → [auth, autorizacion], mutaciones → [+admin]; register `next-sku` before `:id`
- [x] **4.3** — Update `rutas/index.ts` — add `import` and `registrarRutasCatalogo(app)` call

## Phase 5: Tests

- [x] **5.1** — Create `test/catalogo.test.ts` — GET /api/productos sans token → 401, GET /api/productos/next-sku sans token → 401, POST /api/productos sans token → 401

## Phase 6: Frontend

- [x] **6.1** — Add 9 API functions to `lib/api.ts`: `fetchProductos`, `fetchProducto`, `crearProducto`, `actualizarProducto`, `eliminarProducto`, `fetchVariantes`, `crearVariante`, `actualizarVariante`, `eliminarVariante`
- [x] **6.2** — Create `pages/catalogo/CatalogPage.tsx` — product grid with cards, search by nombre, category filter dropdown, "Nuevo producto" button (admin), empty state
- [x] **6.3** — Create `components/catalogo/ProductFormModal.tsx` — form: nombre, descripción, categoría, tiene_variantes switch; if false show precio + stock; admin only
- [x] **6.4** — Create `pages/catalogo/ProductDetailPage.tsx` — product info header, variants table, add/edit/delete variant buttons (admin)
- [x] **6.5** — Create `components/catalogo/VariantFormModal.tsx` — form: nombre, sku, precio, costo, stock, stock_minimo; admin only
- [x] **6.6** — Replace `/catalogo` placeholder in `App.tsx` with `<CatalogPage>` and `<ProductDetailPage>` routes
