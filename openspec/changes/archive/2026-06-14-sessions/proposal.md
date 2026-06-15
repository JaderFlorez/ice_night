# Proposal: Tables & Sessions — ICE NIGHT ERP

## Intent

Core revenue flow: meseros open tabs per table, add consumption items, close with payment. Primary business transaction of the nightclub.

## Scope

### In Scope
- **3a (PR #1 ~400 ln)**: Mesa CRUD + basic session lifecycle (open/close empty)
- **3b (PR #2 ~350 ln)**: Item consumption, real close with stock TX
- **3c (PR #3 ~550 ln)**: Frontend — mesas page, session view, active sessions sidebar

### Out of Scope
Receipts, split bills, multi-payment, discounts (v2). Inventory management (separate).

## Capabilities

### New Capabilities
- `mesas`: CRUD tables (numero, capacidad, ubicacion, soft-delete)
- `sesiones`: POS session lifecycle — open tab, add items, close + stock deduction

### Modified Capabilities
None.

## Approach

Three stacked PRs. **3a**: `mesa-repositorio.ts`, `sesion-repositorio.ts`, 8 use cases, DTOs, controllers/routes, auth guard tests. **3b**: `item-sesion-repositorio.ts`, AgregarConsumo, ObtenerCuenta, CerrarSesion (TX: FOR UPDATE variantes → deduct stock → INSERT movimiento_stock → UPDATE sesion). **3c**: API client, MesasPage, MesaFormModal, SesionPage, SesionesActivas. All routes → `[auth, autorizacion]`; mesa mutations → `admin`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `repositorios/mesa-repositorio.ts` | New | MesaRepositorio impl |
| `repositorios/sesion-repositorio.ts` | New | SesionRepositorio impl |
| `repositorios/item-sesion-repositorio.ts` | New | ItemSesionRepositorio impl |
| `aplicacion/mesas/`, `sesiones/` | New | 9 use cases |
| `controladores/mesas.ts`, `sesiones.ts` | New | Handlers |
| `rutas/` + `dto.ts` + `index.ts` | New/Mod | Routes & DTOs |
| `test/` | New | Auth guard + domain |
| `frontend/` | New/Mod | Pages, API client, routes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TX deadlock on stock | Low | FOR UPDATE, short TX, proper error handling |
| Race: two meseros open same mesa | Low | DB unique index `idx_sesion_mesa_abierta` (exists) |
| Frontend crashes on missing data | Low | Loading + empty states |

## Rollback Plan

Revert PR #3 → #2 → #1. Git revert per PR. No schema changes beyond existing migrations. Failed TX auto-rollbacks.

## Dependencies

- Variante stock field, MovimientoStock entity/repo interface (existing)
- Auth middleware: `auth`, `autorizacion`, `admin` (existing)

## Success Criteria

- [ ] `POST /api/mesas/:id/abrir` → 201, blocks duplicate open session
- [ ] `POST /api/sesiones/:id/items` snapshots precio_unitario from variante
- [ ] `PUT /api/sesiones/:id/cerrar` deducts stock via TX, errors on insufficient
- [ ] `GET /api/sesiones/:id/cuenta` returns items + subtotal sum
- [ ] All routes 401 no token, 403 inactive user
- [ ] Frontend: CRUD mesas, open session, add items, close with payment
- [ ] `tsc --noEmit` passes; `npm test` passes
