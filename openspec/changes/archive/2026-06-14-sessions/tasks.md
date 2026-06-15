# Tasks: Tables & Sessions (ICE NIGHT ERP)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,300 (PR #1: ~400, PR #2: ~350, PR #3: ~550) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 → PR #2 → PR #3 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend — Mesas CRUD + sesiones básicas | PR #1 | Basis: repos, use cases, controllers, routes, auth guard tests. Base = main. |
| 2 | Backend — Items + cierre real con TX | PR #2 | Item repo, AgregarConsumo, ObtenerCuenta, CerrarSesion (TX stock deduct). Base = main. |
| 3 | Frontend — páginas de mesas y sesiones | PR #3 | API client types, MesasPage, MesaFormModal, SesionPage, CerrarSesionModal, routes. Base = main. |

## Phase 1: Repositorios

- [x] **1.1** — `infraestructura/repositorios/mesa-repositorio.ts`: impl `MesaRepositorio` (findAll, findById, save, updateEstado) following `usuario-repositorio.ts` pattern
- [x] **1.2** — `infraestructura/repositorios/sesion-repositorio.ts`: impl `SesionRepositorio` (findById, findByMesaAbierta, save, cerrar) — `findByMesaAbierta` queries `WHERE mesa_id=$1 AND estado='abierta'`

## Phase 2: Casos de Uso — Mesas

- [x] **2.1** — `aplicacion/mesas/ListarMesas.ts`: ejecutar() → Mesa[], repo.findAll()
- [x] **2.2** — `aplicacion/mesas/CrearMesa.ts`: ejecutar(CrearMesaDTO) → Mesa, validate numero not taken
- [x] **2.3** — `aplicacion/mesas/ActualizarMesa.ts`: ejecutar(id, data) → void, validate exists + numero unique if changed
- [x] **2.4** — `aplicacion/mesas/EliminarMesa.ts`: ejecutar(id) → void, soft-delete activa=false

## Phase 3: Casos de Uso — Sesiones

- [x] **3.1** — `aplicacion/sesiones/AbrirSesion.ts`: ejecutar(mesaId, meseroId) → Sesion, check no open session, throw MesaOcupada
- [x] **3.2** — `aplicacion/sesiones/CerrarSesionSinItems.ts`: ejecutar(id) → void, throw SesionYaCerrada if already closed
- [x] **3.3** — `aplicacion/sesiones/ObtenerSesion.ts`: ejecutar(id) → Sesion, throw SesionNoEncontrada
- [x] **3.4** — `aplicacion/sesiones/ListarSesionesActivas.ts`: ejecutar() → Sesion[], findAll estado='abierta'

## Phase 4: HTTP Layer — Mesas

- [x] **4.1** — `presentacion/controladores/mesas.ts`: listar, crear, actualizar, eliminar handlers (follow `auth.ts` controller pattern)
- [x] **4.2** — `presentacion/controladores/sesiones.ts`: abrir, cerrar, obtener, listarActivas handlers
- [x] **4.3** — `presentacion/rutas/mesas.ts`:
  - `GET /api/mesas` — [auth, autorizacion]
  - `POST /api/mesas` — [auth, autorizacion, admin]
  - `PATCH /api/mesas/:id` — [auth, autorizacion, admin]
  - `DELETE /api/mesas/:id` — [auth, autorizacion, admin]
- [x] **4.4** — `presentacion/rutas/sesiones.ts`:
  - `POST /api/mesas/:id/abrir` — [auth, autorizacion]
  - `GET /api/sesiones/activas` — [auth, autorizacion]
  - `GET /api/sesiones/:id` — [auth, autorizacion]
  - `POST /api/sesiones/:id/cerrar` — [auth, autorizacion]
- [x] **4.5** — Update `presentacion/rutas/index.ts`: add `registrarRutasMesas` + `registrarRutasSesiones`

## Phase 5: Tests — PR #1

- [x] **5.1** — `test/mesas.test.ts`: 401 without token, create mesa, list mesas, update, delete
- [x] **5.2** — `test/sesiones.test.ts`: abrir sesion, second abrir fails (MesaOcupada), cerrar sesion

## Phase 6: Items Repositorio + Casos de Uso

- [x] **6.1** — `infraestructura/repositorios/item-sesion-repositorio.ts`: impl `ItemSesionRepositorio` (findBySesion, save, delete)
- [x] **6.2** — `aplicacion/sesiones/AgregarConsumo.ts`: ejecutar(sesionId, varianteId, cantidad) → ItemSesion, snapshot precio from variante, validate sesion open, calc subtotal
- [x] **6.3** — `aplicacion/sesiones/ObtenerCuenta.ts`: ejecutar(sesionId) → { sesion, items, total }, calc SUM(items.subtotal)
- [x] **6.4** — `aplicacion/sesiones/CerrarSesion.ts`: BEGIN TX → FOR UPDATE variantes → verify stock ≥ cantidad → deduct → INSERT movimiento_stock → calc total → UPDATE sesion → COMMIT; throw StockInsuficiente on fail

## Phase 7: HTTP — Items

- [x] **7.1** — Add handlers to `controladores/sesiones.ts`: agregarConsumoHandler, obtenerCuentaHandler; replace cerrarHandler with real TX handler
- [x] **7.2** — Update `rutas/sesiones.ts`: add `POST /api/sesiones/:id/items` [auth, autorizacion], `GET /api/sesiones/:id/cuenta` [auth, autorizacion]; update cerrar route to use real handler

## Phase 8: Tests — PR #2

- [x] **8.1** — Update `test/sesiones.test.ts`: agregar item, obtener cuenta, cerrar with stock check, insufficient stock error

## Phase 9: Frontend — API Client

- [x] **9.1** — Add types + functions to `lib/api.ts`: `MesaDTO`, `SesionDTO`, `ItemSesionDTO`, `CuentaDTO`; fetchMesas, crearMesa, actualizarMesa, eliminarMesa, abrirSesion, cerrarSesion, fetchSesion, fetchSesionesActivas, agregarConsumo, obtenerCuenta

## Phase 10: Frontend — Pages

- [x] **10.1** — `pages/mesas/MesasPage.tsx`: grid de cards con numero, ubicacion, capacidad, estado badge ("Libre"/"Ocupada"), botón "Nueva Mesa" (admin)
- [x] **10.2** — `components/mesas/MesaFormModal.tsx`: form con numero, capacidad, ubicacion; admin only (follow `ProductFormModal` pattern)
- [x] **10.3** — `pages/sesiones/AbrirSesionPage.tsx`: confirm page "Abrir sesión en Mesa #{numero}?", llama API → redirect a /mesas/:id/sesion
- [x] **10.4** — `pages/sesiones/SesionPage.tsx`: header con info mesa + timer, tabla items, buscador variante + cantidad, total, botón "Cerrar cuenta"
- [x] **10.5** — `components/sesiones/CerrarSesionModal.tsx`: muestra total, select metodo_pago (efectivo/tarjeta/transferencia), confirmar

## Phase 11: Frontend — Routes

- [x] **11.1** — Update `App.tsx`: add `/mesas` → MesasPage, `/mesas/nueva` → MesaFormModal (inline or page), `/mesas/:id/abrir` → AbrirSesionPage, `/mesas/:id/sesion` → SesionPage; replace placeholder div
