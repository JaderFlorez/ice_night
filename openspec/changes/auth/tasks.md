# Tasks: Auth Module — ICE NIGHT ERP

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800–1000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 (backend auth) → PR #2 (frontend auth) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend auth endpoints + tests | PR #1 | Base: main. Use cases, controller, routes, UsuarioRepositorioImpl |
| 2 | Frontend auth pages + guards + layout | PR #2 | Base: main (after PR #1 merged). Context, routing, pages, guards |

## Phase 1: Backend Auth — Repository + Use Cases (PR #1)

- [x] **1.1** Create `backend/src/infraestructura/repositorios/usuario-repositorio.ts` — implement `UsuarioRepositorio` via pg `getPool()`, with private `mapearUsuario(row)` helper. Methods: findByEmail, findById, save, updateEstado, listPendientes. Dependencies: `pool.ts`, `Usuario` type
- [x] **1.2** Create `backend/src/core/aplicacion/auth/ObtenerPerfil.ts` — class with injected UsuarioRepositorio, method `ejecutar(usuarioId: string): Promise<Usuario>`, throws `UsuarioNoEncontrado` if null
- [x] **1.3** Create `backend/src/core/aplicacion/auth/ListarPendientes.ts` — class with injected UsuarioRepositorio, method `ejecutar(): Promise<Usuario[]>`
- [x] **1.4** Create `backend/src/core/aplicacion/auth/AprobarUsuario.ts` — class with injected UsuarioRepositorio, method `ejecutar(usuarioId: string, nuevoEstado: 'activo' | 'rechazado'): Promise<void>`, throws `UsuarioNoEncontrado`, idempotent if already target state
- [x] **1.5** Create `backend/src/presentacion/controladores/auth.ts` — 3 handlers: `perfilHandler` (GET), `listarPendientesHandler` (GET), `aprobarUsuarioHandler` (PATCH, validates body with AprobarUsuarioSchema). All use try/catch with Spanish error messages
- [x] **1.6** Create `backend/src/presentacion/rutas/auth.ts` — register 3 routes with preHandler chains. Export `registrarRutasAuth(app)`. Modify `backend/src/presentacion/rutas/index.ts` to call it
- [x] **1.7** Ensure `backend/jest.config.mjs` covers new test files (roots already `<rootDir>/test` — verify test/**/*.ts pattern works)
- [x] **1.8** Create `backend/test/auth.test.ts` — integration tests via `app.inject()`: GET /api/auth/perfil 401, GET /api/admin/usuarios/pendientes 401, PATCH /api/admin/usuarios/:id/estado 401
- [x] **1.9** Verify: `tsc --noEmit` (0 errors), `npm test` (all green)

## Phase 2: Frontend Auth — Context + Routing (PR #2)

- [x] **2.1** Add `react-router-dom` to `frontend/package.json` (`npm install react-router-dom`). Create `frontend/src/router.tsx` with route definitions
- [x] **2.2** Create `frontend/src/lib/api.ts` — typed fetch helpers: `fetchPerfil(token)`, `fetchPendientes()`, `aprobarUsuario(id, estado)` pointing to Fastify backend
- [x] **2.3** Create `frontend/src/context/AuthContext.tsx` — AuthProvider with `supabase.auth.getSession()` on mount, `onAuthStateChange` listener, fetches perfil on SIGNED_IN. Exports `{ session, perfil, loading, signOut }`. Hooks: `useAuth()`, `useIsAdmin()`, `useRol()`
- [x] **2.4** Create `frontend/src/components/auth/PublicRoute.tsx` — redirects to /dashboard if logged in + active; renders children otherwise
- [x] **2.5** Create `frontend/src/components/auth/ProtectedRoute.tsx` — no session → /login; loading → spinner; pendiente → /pending-approval; rechazado → /login+error; activo → `<Outlet />`
- [x] **2.6** Create `frontend/src/components/auth/AdminRoute.tsx` — redirects to /dashboard if rol !== 'admin'; renders children otherwise
- [x] **2.7** Create `frontend/src/pages/auth/LoginPage.tsx` — email + password form, calls `supabase.auth.signInWithPassword()`, fetches perfil, redirects based on estado. Route: /login
- [x] **2.8** Create `frontend/src/pages/auth/RegisterPage.tsx` — email + password + nombre form, calls `supabase.auth.signUp()`, redirects to /pending-approval. Route: /register
- [x] **2.9** Create `frontend/src/pages/auth/PendingApprovalPage.tsx` — "Esperando aprobación" + polling every 10s to GET /api/auth/perfil, auto-redirect when estado changes to 'activo'. Route: /pending-approval
- [x] **2.10** Create `frontend/src/pages/admin/UserManagementPage.tsx` — fetches pending users, table with Aprobar/Rechazar buttons, toast feedback, empty state. Route: /admin/usuarios
- [x] **2.11** Create `frontend/src/components/layout/AppLayout.tsx` — responsive sidebar (collapsible mobile), nav links (Dashboard, Mesas, Catálogo, Admin if admin), header with user name + logout button. Uses `<Outlet />`
- [x] **2.12** Update `frontend/src/App.tsx` — wrap in `<AuthProvider>` + `<BrowserRouter>`. Route structure: public routes (PublicRoute), /pending-approval (auth-only), protected routes (ProtectedRoute → AppLayout), admin routes (AdminRoute). Catch-all redirect
- [x] **2.13** Create `frontend/src/test/AuthContext.test.tsx` — verify AuthProvider renders and useAuth returns expected shape; `frontend/src/test/LoginPage.test.tsx` — verify form renders and submit button exists
- [x] **2.14** Verify: `tsc --noEmit` (0 errors), `npm test` (all green), `npm run dev` starts

## Implementation Order

PR #1 first (backend standalone — doesn't depend on frontend). Then PR #2 (frontend consumes the backend endpoints from PR #1). Within each PR, follow the numbered order: repository → use cases → controllers → routes → tests → verify.
