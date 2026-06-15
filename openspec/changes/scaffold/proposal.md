# Propuesta: Scaffold — Infraestructura Base

## Intención

Establecer el esqueleto completo del proyecto con tooling, estructura Clean Architecture, entidades de dominio, conexión a Supabase, y health check. Sin lógica de negocio — prevenir deriva arquitectónica antes de los módulos reales.

## Arquitectura

```
[ Frontend React (Vercel) ] ──► [ Supabase Auth ] (login/register directo)
        │
 (envía JWT en Authorization header)
        ▼
[ Fastify Serverless (Vercel) ] ──► [ Supabase DB + RLS ]
```

- **Auth**: Supabase Auth desde el frontend (no JWT custom)
- **Backend**: Fastify como serverless function en Vercel con `@fastify/aws-lambda`
- **RLS**: Obligatorio — doble capa de seguridad
- **DB**: Supabase Postgres (pool pg directo desde Fastify + cliente Supabase para verify JWT)
- **Deploy**: Frontend + Backend en **Vercel**

## Alcance

### Incluye
- `backend/` + `frontend/` (carpetas separadas)
- **Backend**: Fastify + `@fastify/aws-lambda` + TypeScript strict nodenext + carpetas Clean Architecture
- **Frontend**: Vite + React + Tailwind + `@supabase/supabase-js` + Vitest (shell vacío, sin componentes)
- Entidades de dominio + Value Objects (Usuario, Producto, Variante, Mesa, Sesion, ItemSesion, Compra, ItemCompra, MovimientoStock)
- Repository interfaces (puertos) en `core/dominio/`
- Clases de error: `ErrorDeDominio`, `UsuarioNoEncontrado`, `EmailYaRegistrado`, `StockInsuficiente`
- **Servicio de verificación JWT de Supabase** (no JWT custom — usa `@supabase/supabase-js` server-side para validar tokens)
- Zod schemas para DTOs request/response compartidos
- **`vercel.json`**: routing de todas las rutas `/api/*` a la función serverless de Fastify
- Migraciones SQL: tablas + **RLS policies** + índices + constraints + seed data + **trigger `on_auth_user_created`**
- ESLint + Prettier + .editorconfig + .gitignore
- Git init + commit inicial
- Jest + Supertest con test de health check

### Excluye
- Lógica de negocio (use cases, rutas funcionales)
- UI components
- Pantallas de login/registro (→ Change 1)
- CRUD de catálogo (→ Change 2)
- Sesiones de venta (→ Change 3)

## Capacidades

### Nuevas Capacidades
None — scaffolding puro, sin comportamiento especificable.

### Capacidades Modificadas
None — no hay specs existentes.

## Enfoque Técnico

### Backend (Fastify serverless en Vercel)

```
backend/
├── api/
│   └── index.ts              ← Entry point serverless (@fastify/aws-lambda)
├── src/
│   ├── core/
│   │   ├── dominio/          ← Entidades + Value Objects + interfaces repositorio
│   │   └── aplicacion/       ← Use cases (vacíos en scaffold)
│   ├── infraestructura/
│   │   ├── db/
│   │   │   ├── pool.ts       ← Pool pg directo a Supabase
│   │   │   └── supabase.ts   ← Cliente Supabase server-side (verify JWT)
│   │   ├── repositorios/     ← Implementaciones vacías en scaffold
│   │   └── servicios/
│   │       └── supabase-jwt.ts ← Verificador de tokens Supabase
│   ├── presentacion/
│   │   ├── controladores/
│   │   ├── rutas/
│   │   └── middleware/
│   │       ├── auth.ts       ← Verifica JWT de Supabase
│   │       └── autorizacion.ts ← Checkea usuarios.estado = 'activo'
│   └── tipos/
│       └── dto.ts            ← Zod schemas compartidos
├── test/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**Flujo serverless**: Vercel recibe request → `vercel.json` rutea a `api/index.ts` → `@fastify/aws-lambda` crea instancia de Fastify → procesa request → responde.

**Pool pg**: `node-postgres` (pg) directo a Supabase con `service_role` key para operaciones internas. NO se usa `@supabase/supabase-js` para queries (solo para verify JWT).

**JWT Verification**:
1. Frontend envía request con `Authorization: Bearer <supabase-jwt>`
2. Middleware `auth.ts` usa `@supabase/supabase-js` server-side para verificar el token (`supabase.auth.getUser(token)`)
3. Middleware `autorizacion.ts` consulta `usuarios.estado` — si no es `'activo'`, rechaza

### Frontend

```
frontend/
├── src/
│   ├── lib/
│   │   └── supabase.ts       ← Cliente Supabase browser-side
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css             ← Tailwind imports
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts            ← Con proxy a backend en dev
└── vitest.config.ts
```

### Migraciones SQL

```
supabase/
├── migrations/
│   ├── 00001_usuarios.sql      ← Tabla usuarios + trigger on_auth_user_created
│   ├── 00002_catalog.sql       ← Tablas categorias, productos, variantes
│   ├── 00003_mesas.sql         ← Tabla mesas
│   ├── 00004_sesiones.sql      ← Tablas sesiones, items_sesion
│   ├── 00005_inventario.sql    ← Tablas compras, items_compra, movimientos_stock
│   ├── 00006_rls_policies.sql  ← RLS policies para todas las tablas
│   └── seed.sql                ← Admin default, mesas de prueba, categorías base
```

**RLS Policies clave**:
- `usuarios`: solo el propio usuario y admin pueden leer
- `productos`, `variantes`: todos los usuarios activos pueden leer; solo admin escribe
- `mesas`: todos los usuarios activos pueden leer/actualizar
- `sesiones`: mesero crea/edita las propias; admin ve todas
- `compras`, `movimientos_stock`: solo admin escribe

### Trigger `on_auth_user_created`

```sql
-- Cuando un usuario se registra en Supabase Auth, se crea en public.usuarios
-- con estado 'pendiente'. El admin debe aprobarlo manualmente.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, email, nombre, rol, estado)
  values (new.id, new.email, new.raw_user_meta_data->>'nombre', 'mesero', 'pendiente');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Deploy Config

```json
// vercel.json — rutea todo lo que no sea static a Fastify
{
  "buildCommand": "cd backend && npm run build",
  "outputDirectory": "backend/dist",
  "functions": {
    "api/index.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/api" }
  ]
}
```

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `backend/` | Nuevo | Fastify serverless + Clean Architecture skeleton |
| `frontend/` | Nuevo | Vite + React + Tailwind + Supabase client |
| `supabase/migrations/` | Nuevo | Migraciones DDL + RLS + seed + trigger |
| `vercel.json` | Nuevo | Configuración deploy Vercel |
| Raíz del proyecto | Nuevo | ESLint, Prettier, .editorconfig, .gitignore |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Serverless cold start Fastify | Media | Mantener instancia caliente con pings periódicos o probar el rendimiento en Vercel Pro |
| JWT verification server-side con Supabase | Media | Cachear `supabase.auth.getUser()` con TTL corto para evitar hits repetidos |
| Pool pg en serverless | Media | Usar `pg` con pool efímero (crear/cerrar conexión por request) o usar Supabase JS client para queries |
| Migraciones sin rollback | Media | Cada migration con `DROP` explícito |

## Plan de Rollback

`git reset --hard HEAD~1` — el commit inicial contiene solo scaffolding. Si la migración falla, ejecutar la migration DOWN o DROP manual de tablas creadas.

## Dependencias

- Supabase project (URL + anon key + service_role key)
- Vercel account
- Node 20+, npm 10+

## Criterios de Éxito

- [ ] `npm run dev` inicia backend en puerto 3000 (modo desarrollo local)
- [ ] `GET /health` → `{ status: "ok", timestamp: "<ISO>" }`
- [ ] `tsc --noEmit` sin errores en backend y frontend
- [ ] `npm test` pasa (al menos health check test)
- [ ] Pool pg conecta a Supabase correctamente
- [ ] Cliente Supabase frontend puede registrar usuario
- [ ] Trigger `on_auth_user_created` crea registro en `public.usuarios`
- [ ] `npm run dev` en frontend arranca Vite con proxy al backend
- [ ] Migraciones SQL ejecutan sin error (tablas + RLS + seed)
- [ ] Seed crea admin default + datos de prueba
