## Verification Report

**Change**: catalog
**Version**: N/A (exploration-driven)
**Mode**: Standard

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 25 |
| Tasks complete | 25 |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build (Backend)**: ✅ Passed
```text
$ cd backend && tsc --noEmit
→ Exit 0, no errors
```

**Build (Frontend)**: ✅ Passed
```text
$ cd frontend && tsc --noEmit && vite build
→ tsc: no errors
→ vite: built in 5.37s
  ✓ 99 modules transformed
  dist/index.html             0.62 kB
  assets/index-CODj11hC.css  22.55 kB
  assets/index-D8wAjvon.js  483.86 kB
```

**Tests**: ✅ 7 passed / 0 failed / 0 skipped
```text
$ cd backend && npm test
→ Test Suites: 3 passed, 3 total
→ Tests:       7 passed, 7 total
→ Time:        11.372 s
```

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| GET /api/productos returns 401 without token | Unauthenticated request | `catalogo.test.ts > Catalog — GET /api/productos > returns 401 without token` | ✅ COMPLIANT |
| GET /api/productos/next-sku returns 401 without token | Unauthenticated request | `catalogo.test.ts > Catalog — GET /api/productos/next-sku > returns 401 without token` | ✅ COMPLIANT |
| POST /api/productos returns 401 without token | Unauthenticated request | `catalogo.test.ts > Catalog — POST /api/productos > returns 401 without token` | ✅ COMPLIANT |
| 10 API endpoints registered with correct middleware | All routes | Source inspection of `rutas/catalogo.ts` | ✅ COMPLIANT |
| GET routes use [auth, autorizacion] middleware | Route security | Source inspection — all GET use `auth` constant | ✅ COMPLIANT |
| POST/PATCH/DELETE routes use [+admin] middleware | Route security | Source inspection — all mutations use `admin` constant | ✅ COMPLIANT |
| next-sku registered before :id | Route ordering | Source inspection — line 25 vs line 37 | ✅ COMPLIANT |
| Frontend routes /catalogo and /catalogo/:id | Route registration | Source inspection of `App.tsx` lines 45-46 | ✅ COMPLIANT |
| Frontend API client functions match backend | 9 catalog functions | Source inspection of `lib/api.ts` vs `rutas/catalogo.ts` | ✅ COMPLIANT |
| ListarProductos with search + category filter | Use case | Source inspection of `ListarProductos.ts` + `producto-repositorio.ts` ILIKE | ✅ COMPLIANT |
| ObtenerProducto with embedded variants | Use case | Source inspection of `ObtenerProducto.ts` + JOIN query | ✅ COMPLIANT |
| CrearProducto with auto-creation of "Único" variant | Use case | Source inspection of `CrearProducto.ts` lines 27-40 | ✅ COMPLIANT |
| SugerirSku generates correct pattern (CER-001, MIC-001…) | Use case | Source inspection of `SugerirSku.ts` PREFIJOS map + SQL | ✅ COMPLIANT |
| Soft delete (activo=false / activa=false) | Use case | Source inspection — producto-repositorio `delete()` + variante-repositorio `delete()` | ✅ COMPLIANT |

**Compliance summary**: 14/14 scenarios compliant

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| `ProductoNoEncontrado` in errores.ts | ✅ Implemented | Line 60-64, follows `VarianteNoEncontrada` pattern |
| `delete(id)` in `VarianteRepositorio` | ✅ Implemented | Interface at `repositorios.ts` line 31, impl at `variante-repositorio.ts` line 88 |
| `ActualizarProductoSchema`, `ActualizarVarianteSchema` | ✅ Implemented | `dto.ts` lines 28, 42 — partial of each |
| Optional `precio`/`stock` on CrearProductoSchema | ✅ Implemented | `dto.ts` lines 23-24 with `.optional()` |
| 10 use case files in `core/aplicacion/catalogo/` | ✅ Implemented | All 10 files present |
| 2 repository impl files | ✅ Implemented | `producto-repositorio.ts`, `variante-repositorio.ts` |
| 9 controller handlers (10 actually) | ✅ Implemented | 10 handlers in `controladores/catalogo.ts` |
| Frontend CatalogPage | ✅ Implemented | Grid with cards, search (debounced 300ms), category filter, empty state, admin "Nuevo producto" button |
| Frontend ProductDetailPage | ✅ Implemented | Product header, variants table, edit/delete actions, confirm dialogs |
| Frontend ProductFormModal | ✅ Implemented | Form with nombre, descripción, categoría, tiene_variantes switch, precio+stock when no variants |
| Frontend VariantFormModal | ✅ Implemented | Form with nombre, sku, precio, costo, stock, stock_minimo; auto-suggests SKU via fetchNextSku |
| Route registration in rutas/index.ts | ✅ Implemented | `registrarRutasCatalogo(app)` at line 14 |
| Route registration in App.tsx | ✅ Implemented | Lines 45-46: `/catalogo` and `/catalogo/:id` |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Clean Architecture: Domain → Application → Infrastructure → Presentation | ✅ Yes | Error extends `ErrorDeDominio`, use cases are use-case classes, repos are impls, handlers are Fastify request handlers |
| GET: auth+autorizacion, mutations: +admin | ✅ Yes | Two middleware constants `auth` and `admin` at lines 18-19 |
| Register next-sku before :id | ✅ Yes | Explicit comment + correct registration order |
| Products without variants auto-create "Único" variant | ✅ Yes | `CrearProducto.ts` lines 27-40 |
| Soft delete (SET activo=false / activa=false) | ✅ Yes | Both repos use UPDATE not DELETE |
| 2 stacked PRs strategy | ✅ Yes | Backend + Frontend split as planned |

### Issues Found

**CRITICAL**: 1

1. **Frontend API functions don't unwrap `{ data: ... }` response wrapper** — All 10 catalog API functions in `frontend/src/lib/api.ts` (fetchProductos, fetchProducto, crearProducto, actualizarProducto, eliminarProducto, fetchNextSku, fetchVariantes, crearVariante, actualizarVariante, eliminarVariante) call `res.json()` and return the raw response. The backend wraps ALL responses in `{ data: ... }` (e.g., `reply.send({ data: productos })`). This means:
   - `fetchProductos()` returns `{ data: ProductoDTO[] }` but type says `ProductoDTO[]` — **runtime crash** when the frontend tries `.filter()` or `.map()` on the object
   - `fetchProducto()` returns `{ data: ProductoDTO }` but type says `ProductoDTO` — `producto.nombre` will be `undefined`
   - `fetchNextSku()` returns `{ data: { sku } }` but type says `{ sku: string }`
   - All other catalog API functions have the same mismatch
   - **Fix**: Each function must unwrap: `const json = await res.json(); return json.data;`
   - The existing auth functions (fetchPerfil, fetchPendientes) have the same pattern but possibly the auth backend returns different shapes — this needs auditing too.

**WARNING**: 2

1. **No successful-path tests** — All 3 catalog tests only verify 401 responses without a token. There are zero tests for: successful data retrieval, search/filter with ILIKE, product creation with "Único" variant auto-creation, SKU suggestion logic, soft delete behavior, or variant CRUD operations. The spec compliance is verified by source inspection only, not by passing runtime tests.

2. **Minor response shape inconsistency** — The `fetchProductos` return type is `ProductoDTO[]` but `fetchNextSku` returns `{ sku: string }` directly, while the backend returns `{ data: { sku } }`. Different patterns across functions.

**SUGGESTION**: 1

1. **Typo in CatalogPage line 63** — Comment reads "Debounced" instead of "Debounced" (should be "Debounced" → "Debounced"). Minor, non-functional.

### Verdict

**CONDITIONAL** — Backend implementation is solid (all endpoints exist, correct middleware, all tasks complete, builds pass, tests pass for auth scenarios). Frontend implementation has a CRITICAL runtime contract mismatch: API functions don't unwrap the `{ data: ... }` wrapper that the backend sends, which WILL cause runtime crashes in the browser. This must be fixed before archiving.

### Readiness for archive

**Not ready** — The `{ data: ... }` unwrap issue in `frontend/src/lib/api.ts` must be resolved first. The 8 affected functions need `const json = await res.json(); return json.data;` pattern. Once fixed, the change is ready for archive.
