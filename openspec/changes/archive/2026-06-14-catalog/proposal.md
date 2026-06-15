# Proposal: Catalog Module — ICE NIGHT ERP

## Intent

Product catalog for staff & POS. Products with variants (SKU, price, stock), search by name/category. Core data backbone.

## Scope

### In Scope
- Backend: 9 use cases, 2 repos, 9 handlers, 10 routes, tests
- Frontend: API client, 2 pages, 2 modals, search + category filter
- 2 stacked PRs (~1000 lines)

### Out of Scope
- Images, pagination, category CRUD, batch ops, import/export, stock tracking

## Capabilities

> `openspec/specs/` empty — no existing capabilities.

### New Capabilities
- `product-catalog`: Product/variant CRUD, SKU mgmt, ILIKE search, variant embedding, soft-delete, SKU auto-suggestion

### Modified Capabilities
None.

## Approach

Clean Architecture: Domain → `ProductoNoEncontrado` error, `delete()` on `VarianteRepositorio`. Application → 9 use cases (5 producto + 4 variante). Infrastructure → `ProductoRepositorioImpl` + `VarianteRepositorioImpl` with pg pool. Presentation → `rutas/catalogo.ts` (GET: auth+autorizacion, mutaciones: +admin). Frontend → API client, `/catalogo` grid + `/catalogo/:id` detail + modals. Products without variants auto-create "Único" variant.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `core/dominio/errores.ts` | Modified | Add `ProductoNoEncontrado` |
| `core/dominio/repositorios.ts` | Modified | Add `delete(id)` to `VarianteRepositorio` |
| `tipos/dto.ts` | Modified | Add `ActualizarProductoSchema`, `ActualizarVarianteSchema`; optional `precio`/`stock` on `CrearProductoSchema` |
| `core/aplicacion/catalogo/` | New | 5 producto + 4 variante use cases |
| `infraestructura/repositorios/` | New | `ProductoRepositorioImpl`, `VarianteRepositorioImpl` |
| `presentacion/controladores/` | New | 9 catalog handlers |
| `presentacion/rutas/catalogo.ts` | New | 10 route registrations |
| `presentacion/rutas/index.ts` | Modified | Register catalog routes |
| `frontend/src/lib/api.ts` | Modified | 9 catalog API functions |
| `frontend/src/pages/catalogo/` | New | `CatalogPage`, `ProductDetailPage` |
| `frontend/src/components/catalogo/` | New | `ProductFormModal`, `VariantFormModal` |
| `frontend/src/App.tsx` | Modified | Replace catalog placeholder with real routes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SKU uniqueness race condition | Low | Unique constraint in DB + try-catch in use case |
| Soft-delete cascading to variants | Low | Use case handles variant soft-delete explicitly |
| `next-sku` route matches `:id` | Low | Register before `:id` route — Fastify first-match |

## Rollback Plan

Revert PR#2 (frontend), then PR#1 (backend). No schema changes — uses existing tables. Git revert sufficient.

## Dependencies

- Auth module middleware chain (authMiddleware, autorizacionMiddleware, adminMiddleware)
- Existing `productos` and `variantes` DB tables (applied in scaffold)

## Success Criteria

- [ ] GET /api/productos returns products with embedded variants
- [ ] POST /api/productos without `tiene_variantes` auto-creates "Único" variant
- [ ] GET /api/productos/next-sku?categoria=cerveza returns `CER-{NNN}`
- [ ] ?q=nombre&categoria filters work via ILIKE
- [ ] Frontend catalog page renders product grid with search + filter
- [ ] tsc --noEmit passes 0 errors; npm test passes
