# Proposal: Auth Module — ICE NIGHT ERP

## Intent

Authentication and user management. Users register/login via Supabase Auth (frontend-direct, Option A). Admin approves accounts before system access. Backend handles business data only — profile retrieval and admin approval.

## Scope

### In Scope
- Backend: UsuarioRepositorioImpl, 3 use cases, 3 controllers + routes, tests
- Frontend: AuthProvider + useAuth, 3 route guards, 4 pages, AppLayout with sidebar
- Tests: backend unit (mock repo) + integration (app.inject); frontend unit + integration

### Out of Scope
- Dashboard, catálogo, sesiones, inventario (separate)
- Custom password reset (Supabase handles it)
- PDF/ML features

## Capabilities

### New Capabilities
- `user-auth`: Supabase Auth login/register, session management, JWT verification, route protection, profile retrieval
- `user-admin`: Admin-only endpoints for pending users list and approve/reject

### Modified Capabilities
None.

## Approach

Option A: frontend → Supabase Auth (signUp/signInWithPassword). Fastify handles business data only. JWT verified via supabase.auth.getUser(). React Context for session + perfil. Two PRs: #1 backend (use cases, routes, tests), #2 frontend (pages, auth, routing).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/infraestructura/repositorios/` | New | UsuarioRepositorioImpl |
| `backend/src/core/aplicacion/auth/` | New | 3 use cases |
| `backend/src/presentacion/controladores/` | New | 3 auth handlers |
| `backend/src/presentacion/rutas/auth.ts` | New | 3 endpoint routes |
| `backend/src/presentacion/rutas/index.ts` | Modified | Register auth routes |
| `backend/test/` | New | Unit + integration tests |
| `frontend/src/context/AuthContext.tsx` | New | AuthProvider + useAuth |
| `frontend/src/components/auth/` | New | 3 route guards |
| `frontend/src/pages/` | New | Login, Register, PendingApproval, UserManagement |
| `frontend/src/components/layout/` | New | AppLayout + sidebar |
| `frontend/src/App.tsx` | Modified | BrowserRouter + routes |
| `frontend/package.json` | Modified | Add react-router-dom |

## Risks

| Risk | Likely | Mitigation |
|------|--------|------------|
| Trigger race: row not yet created before perfil call | Low | Handle 404; trigger is transactional |
| Admin double-clicks approve | Low | Idempotent — skip if no-op |
| Supabase Auth downtime | Low | Acceptable for v1 |
| Refresh token expiry after idle | Low | Supabase emits SIGNED_OUT → redirect |

## Rollback Plan

Revert PR#2 then PR#1. No schema changes — uses existing migrations. Git revert sufficient.

## Dependencies

- `react-router-dom` v7 added to `frontend/package.json`

## Success Criteria

- [ ] GET /api/auth/perfil returns perfil with estado
- [ ] Pending user gets 403 on protected endpoints, can access /perfil
- [ ] Admin can list, approve, and reject pending users
- [ ] Login + Register forms work; pending page polls and auto-redirects
- [ ] Route guards protect correct routes
- [ ] tsc --noEmit passes 0 errors; npm test passes
