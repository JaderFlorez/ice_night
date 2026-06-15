# Tasks: Scaffold

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1000-1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation → PR 2: Backend → PR 3: Frontend |
| Delivery strategy | ask-always |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Notes |
|------|------|-----------|------|-------|
| 1 | Project init + Backend config + Migrations | PR 1 | main | package.json, tsconfig, root configs, git init, all 7 SQL migrations |
| 2 | Domain entities + Infrastructure + Health | PR 2 | main | Entities, errors, repos, DB pool, JWT, middleware, health route + test |
| 3 | Frontend shell + DTOs + Config update | PR 3 | main | Vite+React+Tailwind, Supabase client, Zod schemas, config.yaml edit |

## Phase 1: Foundation

- [x] 1.1 Create `backend/package.json` with fastify, @fastify/aws-lambda, @supabase/supabase-js, pg, zod, dotenv + dev deps (typescript, tsx, jest, ts-jest, @types/jest, supertest, @types/supertest)
- [x] 1.2 Create `frontend/package.json` with react, react-dom, @supabase/supabase-js + dev deps (vite, @vitejs/plugin-react, typescript, tailwindcss, postcss, autoprefixer, vitest, @testing-library/react, @testing-library/jest-dom)
- [x] 1.3 Create `.gitignore`, `.editorconfig`, `.prettierrc`, `eslint.config.js`
- [x] 1.4 `git init` + `npm install` in backend/ and frontend/
- [x] 1.5 Create `backend/tsconfig.json` (strict, nodenext) + `backend/api/index.ts` (@fastify/aws-lambda entry point) + `backend/src/app.ts` (Fastify app with health route)
- [x] 1.6 Create `vercel.json` with build command, output dir, function config, rewrites

## Phase 2: Domain

- [x] 2.1 Create `backend/src/core/dominio/errores.ts` — ErrorDeDominio + UsuarioNoEncontrado, EmailYaRegistrado, StockInsuficiente, SesionNoEncontrada, MesaOcupada, SesionYaCerrada, UsuarioNoActivo, VarianteNoEncontrada
- [x] 2.2 Create entity interfaces: `usuario.ts`, `producto.ts`, `variante.ts`, `mesa.ts`, `sesion.ts` (+ ItemSesion), `compra.ts` (+ ItemCompra), `movimiento-stock.ts`
- [x] 2.3 Create `backend/src/core/dominio/repositorios.ts` — UsuarioRepositorio, ProductoRepositorio, VarianteRepositorio, MesaRepositorio, SesionRepositorio, ItemSesionRepositorio, CompraRepositorio, MovimientoStockRepositorio

## Phase 3: Infrastructure

- [x] 3.1 Create `backend/src/infraestructura/db/pool.ts` — pg Pool with Supabase service_role connection string
- [x] 3.2 Create `backend/src/infraestructura/db/supabase.ts` — Supabase admin client for JWT verification
- [x] 3.3 Create `backend/src/infraestructura/servicios/supabase-jwt.ts` — wrapper calling `supabase.auth.getUser(token)`
- [x] 3.4 Create `backend/src/presentacion/middleware/auth.ts` — extract Bearer token, verify via Supabase, decorate request
- [x] 3.5 Create `backend/src/presentacion/middleware/autorizacion.ts` — query `usuarios.estado`, reject if !== 'activo'

## Phase 4: Presentation & Tests

- [x] 4.1 Create `backend/src/presentacion/controladores/health.ts` — GET /health → `{ status: "ok", timestamp, uptime }`
- [x] 4.2 Create `backend/src/presentacion/rutas/index.ts` — register `/health` on Fastify instance
- [x] 4.2b REFACTOR `backend/src/app.ts` — replace inline health route with `registrarRutas(app)` call
- [x] 4.3 Create `backend/test/health.test.ts` + `backend/test/tsconfig.json` — Supertest: GET /health returns 200 + body with status, timestamp, uptime
- [x] 4.4 Verify `tsc --noEmit` passes + `npm test` passes

## Phase 5: Database & Frontend

- [x] 5.1 Create `supabase/migrations/00001_usuarios.sql` — usuarios table + trigger on_auth_user_created
- [x] 5.2 Create `supabase/migrations/00002_catalog.sql` — productos + variantes tables + indexes
- [x] 5.3 Create `supabase/migrations/00003_mesas.sql` — mesas table
- [x] 5.4 Create `supabase/migrations/00004_sesiones.sql` — sesiones + items_sesion + partial unique index
- [x] 5.5 Create `supabase/migrations/00005_inventario.sql` — compras + items_compra + movimientos_stock
- [x] 5.6 Create `supabase/migrations/00006_rls_policies.sql` — RLS policies per table (read/write by rol)
- [x] 5.7 Create `supabase/migrations/seed.sql` — admin@icenight.com setup + 8 mesas de prueba
- [x] 5.8 Create frontend scaffold: `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/test/setup.ts`
- [x] 5.9 Create `frontend/src/lib/supabase.ts` — Supabase browser client with anon key
- [x] 5.10 Create `backend/src/tipos/dto.ts` — Zod schemas for shared request/response DTOs
- [x] 5.11 Update `openspec/config.yaml` — change auth to Supabase Auth, deploy to Vercel (single provider)
