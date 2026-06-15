## Exploration: Auth Module — ICE NIGHT ERP

### Current State

**Backend** (scaffold completo):
- Middleware de autenticación (`auth.ts`) verifica JWT contra Supabase via `supabase.auth.getUser()`
- Middleware de autorización (`autorizacion.ts`) chequea `usuarios.estado === 'activo'` en DB
- Pool pg con `service_role` listo, cliente Supabase admin listo
- DTOs: `RegistroSchema`, `LoginSchema`, `AprobarUsuarioSchema` ya existen
- Errores de dominio: `UsuarioNoEncontrado`, `EmailYaRegistrado`, `UsuarioNoActivo` ya existen
- Repositorio interface: `UsuarioRepositorio` con `findByEmail`, `findById`, `save`, `updateEstado`, `listPendientes`
- `rutas/index.ts` solo registra `GET /api/health` — no hay rutas auth aún

**Base de datos** (migraciones aplicadas):
- `auth.users` manejado por Supabase Auth (password hashing, MFA, refresh tokens)
- `public.usuarios` con FK a `auth.users(id)`, columnas: email, nombre, rol, estado
- Trigger `on_auth_user_created`: al insertar en `auth.users`, crea registro en `public.usuarios` con estado `pendiente`
- Trigger `make_first_user_admin`: el primer usuario registrado se convierte en `admin` automáticamente
- Seed crea 8 mesas de prueba (no crea admin por seed — el primer signup es admin)

**Frontend** (scaffold mínimo):
- Cliente Supabase browser en `frontend/src/lib/supabase.ts` (anon key)
- Shell React vacío (`App.tsx`)
- Sin `react-router-dom`, sin contexto de auth, sin páginas
- Dependencias: React 19, Vite 6, Tailwind 4

### Decision Confirmed: Option A — Frontend Direct to Supabase Auth

El design doc del scaffold dice:

> **Supabase Auth** desde frontend. Backend verifica JWT con `supabase.auth.getUser()`.

**Confirmo: Option A es el plan correcto.** La data flow diagram en `design.md` tiene una inconsistencia (muestra login/register pasando por el backend), pero la decisión de arquitectura es clara y correcta: el frontend habla directo con Supabase Auth, el backend solo verifica JWTs y maneja datos de negocio.

**Razones por las que Option A es la correcta:**
- Supabase maneja refresh tokens, password reset, MFA out-of-the-box
- Proxear auth por Fastify agrega latencia y superficie de seguridad sin beneficio real
- El backend ya no necesita mantener estado de sesión
- La verificación de `estado` se hace en cada request via middleware `autorizacion.ts`

**Lo que SÍ va por Fastify:**
- `GET /api/auth/perfil` — obtener perfil del usuario desde `public.usuarios`
- `GET /api/admin/usuarios/pendientes` — listar pendientes
- `PATCH /api/admin/usuarios/:id/aprobar` — aprobar/rechazar

---

### Auth Flow (Text Diagram)

```
REGISTRATION
───────────────────────────────────────────────────
Frontend                           Supabase Auth            Backend / DB
   │                                    │                      │
   ├─ supabase.auth.signUp({           │                      │
   │   email, password,                │                      │
   │   options: { data: { nombre } }   │                      │
   │ }) ──────────────────────────────►│                      │
   │                                    ├── INSERT auth.users  │
   │                                    ├── TRIGGER on_auth_   │
   │                                    │   user_created ─────►│
   │                                    │                      ├── INSERT public.usuarios
   │                                    │                      │   (estado='pendiente')
   │                                    │                      ├── IF first_user: 
   │                                    │                      │   UPDATE rol='admin',
   │                                    │                      │   estado='activo'
   │◄── { user, session } ─────────────┤                      │
   │                                    │                      │
   ├─ GET /api/auth/perfil ───────────────────────────────────►│
   │◄── { ...usuario, estado:'pendiente' } ───────────────────┤
   │                                    │                      │
   └─ redirect /pending-approval        │                      │


LOGIN (existing user)
───────────────────────────────────────────────────
Frontend                           Supabase Auth            Backend / DB
   │                                    │                      │
   ├─ supabase.auth.signInWithPassword( │                      │
   │   { email, password }              │                      │
   │ ) ────────────────────────────────►│                      │
   │◄── { user, session } ─────────────┤                      │
   │                                    │                      │
   ├─ GET /api/auth/perfil ───────────────────────────────────►│
   │◄── { ...usuario, estado } ───────────────────────────────┤
   │                                    │                      │
   ├─ [if estado='pendiente'] → redirect /pending-approval    │
   ├─ [if estado='rechazado'] → show "Cuenta rechazada"       │
   └─ [if estado='activo']    → redirect /dashboard           │


ADMIN APPROVAL
───────────────────────────────────────────────────
Admin Frontend                     Backend (Fastify)          DB
   │                                    │                      │
   ├─ GET /api/admin/usuarios/          │                      │
   │   pendientes ────────────────────►│                      │
   │   (JWT + auth middleware)          │                      │
   │                                    ├── auth: verify JWT   │
   │                                    ├── autorizacion:      │
   │                                    │   check estado='activo'
   │                                    ├── rol='admin' check  │
   │                                    ├── SELECT ... WHERE   │
   │                                    │   estado='pendiente─►│
   │◄── [ { id, email, nombre,         │                      │
   │        created_at } ] ────────────┤                      │
   │                                    │                      │
   ├─ PATCH /api/admin/usuarios/       │                      │
   │   :id/aprobar                     │                      │
   │   { estado: 'activo' } ──────────►│                      │
   │                                    ├── auth + autorizacion│
   │                                    ├── rol='admin' check  │
   │                                    ├── UPDATE usuarios    │
   │                                    │   SET estado='activo'│
   │◄── { success } ───────────────────┤                      │
   │                                    │                      │
   └─ toast "Usuario aprobado"         │                      │
```

---

### Frontend Pages List

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | `LoginPage` | Public (redirect if active) | Email + password form. Calls `supabase.auth.signInWithPassword()`, then `GET /api/auth/perfil`. Redirects based on estado. |
| `/register` | `RegisterPage` | Public (redirect if active) | Email + password + name form. Calls `supabase.auth.signUp()`, then redirects to `/pending-approval`. |
| `/pending-approval` | `PendingApprovalPage` | Auth only (any estado) | Shows "Esperando aprobación del administrador". Polls `GET /api/auth/perfil` cada 10s. Redirects to `/dashboard` when estado changes to `activo`. |
| `/dashboard` | `DashboardPage` | Auth + Active | Home del sistema. KPIs, acceso a secciones. |
| `/admin/usuarios` | `UserManagementPage` | Auth + Active + Admin | Lista de usuarios pendientes. Botones Aprobar/Rechazar. |
| `/mesas` | `TablesPage` | Auth + Active | Gestión de mesas. |
| `/catalogo` | `CatalogPage` | Auth + Active | Productos y variantes. |
| `/sesiones` | `SessionsPage` | Auth + Active | Sesiones activas. |

---

### Backend Endpoints

| Method | Path | Middleware | Input | Output | Description |
|--------|------|-----------|-------|--------|-------------|
| `GET` | `/api/auth/perfil` | `auth` | — | `{ id, email, nombre, rol, estado, created_at }` | Retorna perfil desde `public.usuarios`. No requiere `autorizacionMiddleware` para que usuarios pendientes puedan consultar su estado. |
| `GET` | `/api/admin/usuarios/pendientes` | `auth + autorizacion + admin` | — | `{ usuarios: [{ id, email, nombre, created_at }] }` | Lista usuarios con `estado = 'pendiente'`. Solo admin. |
| `PATCH` | `/api/admin/usuarios/:id/estado` | `auth + autorizacion + admin` | `{ "estado": "activo" \| "rechazado" }` | `{ "mensaje": "Usuario actualizado" }` | Cambia estado de un usuario. Solo admin. Valida `estado` contra `AprobarUsuarioSchema`. |

**Nota sobre `/api/auth/register` y `/api/auth/login`**: NO van por backend. El frontend llama directo a Supabase Auth. Fastify solo se ocupa de lo que Supabase Auth no puede hacer: consultar y modificar datos de negocio en `public.usuarios`.

---

### React Component Tree (Auth)

```
<App>
  <AuthProvider>                              ← Context + onAuthStateChange
    <BrowserRouter>
      <Routes>
        {/* Public — redirect si ya logueado y activo */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Auth required (cualquier estado) */}
        <Route path="/pending-approval" element={<PendingApprovalPage />} />

        {/* Auth + Active required */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>     ← Sidebar / Header
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/usuarios" element={<UserManagementPage />} />
            <Route path="/mesas" element={<TablesPage />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/sesiones" element={<SessionsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
</App>
```

---

### Auth State Management Design

```typescript
// context/AuthContext.tsx
interface AuthContextValue {
  session: Session | null;        // Supabase session
  perfil: Usuario | null;         // from GET /api/auth/perfil
  loading: boolean;               // initial session check
  signOut: () => Promise<void>;
}

// Initialization flow:
// 1. Mount → supabase.auth.getSession()
// 2. If session → GET /api/auth/perfil → set perfil
// 3. Subscribe to onAuthStateChange:
//    - SIGNED_IN → GET /api/auth/perfil
//    - SIGNED_OUT → clear perfil
//    - TOKEN_REFRESHED → no-op (session updated automatically)
// 4. loading=false

// Helper hooks:
// useAuth()       → { session, perfil, loading, signOut }
// usePerfil()     → perfil (shorthand)
// useRol()        → perfil?.rol
// useIsAdmin()    → perfil?.rol === 'admin'
```

**Token refresh**: Supabase maneja auto-refresh usando el refresh token almacenado en localStorage. El evento `onAuthStateChange` emite `TOKEN_REFRESHED`. No necesitamos lógica adicional — si el refresh falla, Supabase emite `SIGNED_OUT` y el provider limpia el estado.

---

### Route Protection Strategy

```
Route Guards (3 niveles):
────────────────────────
1. PublicRoute
   - Si: perfil && perfil.estado === 'activo' → redirect /dashboard
   - Si no: render children (login/register)

2. ProtectedRoute
   - Si: !session → redirect /login
   - Si: session && loading → show spinner
   - Si: perfil?.estado === 'pendiente' → redirect /pending-approval
   - Si: perfil?.estado === 'rechazado' → redirect /login + error toast
   - Si: perfil?.estado === 'activo' → render <Outlet />

3. AdminRoute (o check dentro del componente)
   - Si: perfil?.rol !== 'admin' → redirect /dashboard + toast
   - Se puede implementar como <RequireRol rol="admin" /> wrapper
```

---

### Technical Risks

| # | Riesgo | Severidad | Mitigación |
|---|--------|-----------|------------|
| R1 | **Race condition trigger**: usuario se registra, `supabase.auth.signUp()` retorna sesión, pero el trigger `on_auth_user_created` aún no insertó en `public.usuarios` | Medium | El trigger es transaccional (misma transacción que INSERT en auth.users). Para cuando signUp retorna, el row en public.usuarios debería existir. No obstante, el `GET /api/auth/perfil` debe manejar el caso `404` o `null` como "perfil no encontrado" y mostrar error apropiado. |
| R2 | **Refresh token expirado**: usuario deja la app abierta varios días, el refresh token expira y no puede renovar | Low | Supabase maneja esto automáticamente — emite `SIGNED_OUT`. El frontend redirige a `/login`. No hay estado corrupto. |
| R3 | **Admin aprueba mientras usuario está en /pending-approval** | Low | El polling de PendingApprovalPage (cada 10s a `GET /api/auth/perfil`) detecta el cambio y redirige al dashboard. |
| R4 | **Admin rechaza usuario que ya estaba aprobado** (doble clic en botón) | Low | El backend debe verificar que el usuario exista y que el cambio sea válido. Idempotencia: si ya está activo, retorna 200 sin error. |
| R5 | **Fallo de Supabase Auth**: Supabase está caído y nadie puede loguearse | Medium | Como el login va directo a Supabase (no proxy por Fastify), no podemos cachear ni fallback. Para v1, esto es aceptable (downtime de Supabase es raro). Documentar como parte del SLA esperado. |
| R6 | **JWT válido pero usuario eliminado de public.usuarios** | Low | Si `authMiddleware` pasa (JWT válido) pero `public.usuarios` no tiene el registro, el `autorizacionMiddleware` retorna 403. El perfil endpoint también debe devolver 404. Consistente. |

---

### Frontend Dependencies Needed

Agregar a `frontend/package.json`:
- `react-router-dom` — routing declarativo (BrowserRouter, Routes, Route, Outlet, Navigate)
- `@supabase/ssr` (opcional, v1) — para mejor manejo de cookies vs localStorage si se necesita SSR más adelante

No se necesita `zustand` ni `redux` — el auth state es simple (session + perfil), React Context es suficiente.

---

### Recommended Implementation Order

**Fase 1 — Backend auth endpoints** (sin frontend)
1. `GET /api/auth/perfil` — controlador + ruta + integración con `UsuarioRepositorio`
2. `GET /api/admin/usuarios/pendientes` — controlador + ruta (admin only)
3. `PATCH /api/admin/usuarios/:id/estado` — controlador + ruta + validación DTO

**Fase 2 — Frontend auth foundation**
4. Agregar `react-router-dom` a frontend
5. `AuthProvider` + `useAuth` hook (context, session, onAuthStateChange)
6. Route guards: `PublicRoute`, `ProtectedRoute`, `AdminRoute`

**Fase 3 — Frontend auth pages**
7. `LoginPage` — formulario email + password, conexión con Supabase
8. `RegisterPage` — formulario email + password + nombre
9. `PendingApprovalPage` — mensaje + polling de perfil

**Fase 4 — Frontend admin + layout**
10. `UserManagementPage` — listar pendientes, aprobar/rechazar
11. `AppLayout` — sidebar con navegación, header con user info + logout

---

### Ready for Proposal

**Sí.** El flujo está claro, Option A está confirmada, los riesgos están identificados, y hay un orden de implementación definido. 

Lo que debería decirle el orchestrator al usuario:
1. **Confirmar Option A** (frontend direct a Supabase Auth) — esto ya está decidido y solo se necesita un "sí, seguimos así"
2. **Preguntar si email confirmation debe estar desactivado** en Supabase Auth settings (para que el signup cree sesión inmediatamente sin confirmar email)
3. **Sobre el orden**: arrancar por backend endpoints y luego frontend auth, que es lo que está descrito arriba
