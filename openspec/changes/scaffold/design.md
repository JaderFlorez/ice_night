# Design: Scaffold — Infraestructura Base

## Technical Approach

Monorepo con `backend/` (Fastify serverless) y `frontend/` (Vite + React). Backend expone solo `/health` en este cambio. Toda request entrante pasa por middleware de JWT verification + autorización. Seed admin via trigger `on_auth_user_created`.

## Architecture Decisions

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Supabase Auth vs. custom JWT | Custom JWT da control total pero agrega superficie de seguridad. Supabase Auth maneja refresh tokens, MFA, password reset out-of-the-box. | **Supabase Auth** desde frontend. Backend verifica JWT con `supabase.auth.getUser()`. |
| pg directo vs. Supabase JS para queries | Supabase JS es más lento (pasa por REST). `pg` directo da control sobre conexiones y transacciones. | **pg directo** para queries. `@supabase/supabase-js` solo para verify JWT server-side. |
| @fastify/aws-lambda en Vercel vs. Railway | Railway da cold-start más rápido. Vercel unifica frontend+backend, evita segundo proveedor. | **@fastify/aws-lambda** en Vercel. Aceptamos cold start a cambio de deploy unificado. |
| Pool efímero vs. conexión persistente en serverless | Pool persistente da mejor latency pero puede leakear conexiones. Pool efímero es más seguro. | **Pool con lifetime por instancia**. Vercel mantiene la instancia caliente entre requests. |
| Nombres entidades en español vs. inglés | Inglés es estándar técnico. Español alinea código con lenguaje ubicuo del negocio. | **Español** para entidades de dominio y use cases. Inglés para types/DTOs técnicos. |
| (Nota) Config.yaml dice "no Supabase Auth" y "Railway" | El proposal y el user sobreescriben: **Supabase Auth + Vercel**. El config.yaml está desactualizado y debe actualizarse en este cambio. | **Actualizar config.yaml** para reflejar auth por Supabase y deploy en Vercel. |

## Data Flow

```
Frontend (Vite+React)          Backend (Fastify)                Supabase
       │                            │                              │
       ├─ login/register ──────────►│                              │
       │◄──── JWT token ────────────┤                              │
       │                            │                              │
       ├─ GET /api/health ─────────►│                              │
       │◄──── { status: "ok" } ─────┤                              │
       │                            │                              │
       ├─ GET /api/recurso ────────►│                              │
       │   Authorization: Bearer JWT│                              │
       │                            ├── supabase.auth.getUser(JWT)─►│
       │                            │◄──── user data ──────────────┤
       │                            ├── SELECT FROM usuarios ─────►│
       │                            │◄── usuario.estado ──────────┤
       │◄── 200 / 401 / 403 ────────┤                              │
```

## Directory Structure

```
backend/
├── api/index.ts                    ← Entry point serverless (@fastify/aws-lambda)
├── src/
│   ├── core/
│   │   ├── dominio/
│   │   │   ├── errores.ts          ← ErrorDeDominio + subclases
│   │   │   ├── usuario.ts          ← Interface Usuario
│   │   │   ├── producto.ts         ← Interface Producto
│   │   │   ├── variante.ts         ← Interface Variante
│   │   │   ├── mesa.ts             ← Interface Mesa
│   │   │   ├── sesion.ts           ← Interface Sesion + ItemSesion
│   │   │   ├── compra.ts           ← Interface Compra + ItemCompra
│   │   │   ├── movimiento-stock.ts ← Interface MovimientoStock
│   │   │   └── repositorios.ts     ← Todos los repository interfaces
│   │   └── aplicacion/             ← (vacíos en scaffold)
│   ├── infraestructura/
│   │   ├── db/
│   │   │   ├── pool.ts             ← Pool pg a Supabase (service_role)
│   │   │   └── supabase.ts         ← Cliente Supabase admin para verify JWT
│   │   ├── repositorios/           ← (implementaciones vacías en scaffold)
│   │   └── servicios/
│   │       └── supabase-jwt.ts     ← Wrapper sobre supabase.auth.getUser()
│   ├── presentacion/
│   │   ├── controladores/
│   │   │   └── health.ts           ← GET /health handler
│   │   ├── rutas/
│   │   │   └── index.ts            ← Registrar todas las rutas
│   │   └── middleware/
│   │       ├── auth.ts             ← Extrae JWT, verifica con Supabase
│   │       └── autorizacion.ts     ← Verifica usuarios.estado === 'activo'
│   └── tipos/
│       └── dto.ts                  ← Zod schemas compartidos
├── test/
│   └── health.test.ts             ← Supertest: GET /health → 200
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── lib/
│   │   └── supabase.ts            ← Cliente Supabase browser (anon key)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  ← @tailwind base/components/utilities
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts                 ← Proxy /api → backend:3000 en dev
└── vitest.config.ts

supabase/
└── migrations/
    ├── 00001_usuarios.sql
    ├── 00002_catalog.sql
    ├── 00003_mesas.sql
    ├── 00004_sesiones.sql
    ├── 00005_inventario.sql
    ├── 00006_rls_policies.sql
    └── seed.sql
```

## Interfaces / Contracts

```typescript
// core/dominio/errores.ts
class ErrorDeDominio extends Error { constructor(msg: string) { super(msg); this.name = 'ErrorDeDominio'; } }
class UsuarioNoEncontrado extends ErrorDeDominio {}
class EmailYaRegistrado extends ErrorDeDominio {}
class StockInsuficiente extends ErrorDeDominio {}
class SesionNoEncontrada extends ErrorDeDominio {}
class MesaOcupada extends ErrorDeDominio {}
class SesionYaCerrada extends ErrorDeDominio {}

// core/dominio/repositorios.ts — Repository interfaces (ports)
interface UsuarioRepositorio {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  save(usuario: Usuario): Promise<void>;
  updateEstado(id: string, estado: Usuario['estado']): Promise<void>;
  listPendientes(): Promise<Usuario[]>;
}
interface ProductoRepositorio { findAll(): Promise<Producto[]>; findById(id: string): Promise<Producto | null>; save(p: Producto): Promise<void>; update(p: Producto): Promise<void>; delete(id: string): Promise<void>; }
interface VarianteRepositorio { findByProducto(productoId: string): Promise<Variante[]>; findById(id: string): Promise<Variante | null>; save(v: Variante): Promise<void>; update(v: Variante): Promise<void>; }
interface MesaRepositorio { findAll(): Promise<Mesa[]>; findById(id: string): Promise<Mesa | null>; save(m: Mesa): Promise<void>; updateEstado(id: string, activa: boolean): Promise<void>; }
interface SesionRepositorio { findById(id: string): Promise<Sesion | null>; findByMesaAbierta(mesaId: string): Promise<Sesion | null>; save(s: Sesion): Promise<void>; update(s: Sesion): Promise<void>; }
interface ItemSesionRepositorio { findBySesion(sesionId: string): Promise<ItemSesion[]>; save(i: ItemSesion): Promise<void>; delete(id: string): Promise<void>; }
interface CompraRepositorio { findAll(): Promise<Compra[]>; findById(id: string): Promise<Compra | null>; save(c: Compra): Promise<void>; }
interface MovimientoStockRepositorio { findByVariante(varianteId: string): Promise<MovimientoStock[]>; save(m: MovimientoStock): Promise<void>; }
```

## Middleware Chain

```typescript
// presentacion/middleware/auth.ts — Extrae Bearer token, verifica con Supabase
fastify.decorateRequest('usuario', null);
async function authMiddleware(req, reply) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return reply.status(401).send({ error: 'Token requerido' });
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return reply.status(401).send({ error: 'Token inválido' });
  req.usuario = { id: user.id, email: user.email };
}

// presentacion/middleware/autorizacion.ts — Verifica usuarios.estado === 'activo'
async function autorizacionMiddleware(req, reply) {
  const result = await pool.query('SELECT estado FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (result.rows.length === 0 || result.rows[0].estado !== 'activo')
    return reply.status(403).send({ error: 'Usuario no activo' });
}

// Uso en rutas:
fastify.get('/api/health', { preHandler: [] }, healthHandler);         // sin auth
fastify.get('/api/protegido', { preHandler: [authMiddleware, autorizacionMiddleware] }, handler);
```

## Database Schema (Key Tables)

```sql
-- 00001_usuarios.sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'mesero')) DEFAULT 'mesero',
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'activo', 'rechazado')) DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Trigger: crear usuario en public.usuarios al registrarse en auth.users
CREATE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol, estado)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nombre', 'mesero', 'pendiente');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 00002_catalog.sql
CREATE TABLE productos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombre TEXT NOT NULL, descripcion TEXT, categoria TEXT NOT NULL CHECK (categoria IN ('cerveza','michelada','soda','snack','otro')), tiene_variantes BOOLEAN NOT NULL DEFAULT false, activo BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE variantes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), producto_id UUID NOT NULL REFERENCES productos(id), nombre TEXT NOT NULL, sku TEXT NOT NULL UNIQUE, precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0), costo DECIMAL(10,2) NOT NULL CHECK (costo >= 0), stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), stock_minimo INTEGER NOT NULL DEFAULT 5, activa BOOLEAN NOT NULL DEFAULT true);
CREATE UNIQUE INDEX idx_variante_producto_nombre ON variantes(producto_id, nombre);

-- 00003_mesas.sql
CREATE TABLE mesas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), numero INTEGER NOT NULL UNIQUE, capacidad INTEGER NOT NULL CHECK (capacidad > 0), ubicacion TEXT, activa BOOLEAN NOT NULL DEFAULT true);

-- 00004_sesiones.sql
CREATE TABLE sesiones (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), mesa_id UUID NOT NULL REFERENCES mesas(id), mesero_id UUID NOT NULL REFERENCES usuarios(id), estado TEXT NOT NULL CHECK (estado IN ('abierta','cerrada')) DEFAULT 'abierta', abierta_en TIMESTAMPTZ NOT NULL DEFAULT now(), cerrada_en TIMESTAMPTZ, metodo_pago TEXT, total DECIMAL(10,2));
CREATE UNIQUE INDEX idx_sesion_mesa_abierta ON sesiones(mesa_id) WHERE estado = 'abierta';
CREATE TABLE items_sesion (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sesion_id UUID NOT NULL REFERENCES sesiones(id), variante_id UUID NOT NULL REFERENCES variantes(id), cantidad INTEGER NOT NULL CHECK (cantidad > 0), precio_unitario DECIMAL(10,2) NOT NULL, subtotal DECIMAL(10,2) NOT NULL, creado_en TIMESTAMPTZ NOT NULL DEFAULT now());

-- 00005_inventario.sql
CREATE TABLE compras (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), proveedor TEXT, notas TEXT, costo_total DECIMAL(10,2) NOT NULL, creado_en TIMESTAMPTZ DEFAULT now());
CREATE TABLE items_compra (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), compra_id UUID NOT NULL REFERENCES compras(id), variante_id UUID NOT NULL REFERENCES variantes(id), cantidad INTEGER NOT NULL CHECK (cantidad > 0), costo_unitario DECIMAL(10,2) NOT NULL, subtotal DECIMAL(10,2) NOT NULL);
CREATE TABLE movimientos_stock (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), variante_id UUID NOT NULL REFERENCES variantes(id), cantidad INTEGER NOT NULL CHECK (cantidad != 0), tipo TEXT NOT NULL CHECK (tipo IN ('compra','venta','ajuste')), referencia_id UUID, creado_en TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_movimientos_variante ON movimientos_stock(variante_id);

-- 00006_rls_policies.sql — Ver proposal para políticas por tabla y rol

-- seed.sql
INSERT INTO auth.users (id, email) VALUES ('seed-admin-uuid', 'admin@icenight.com');
-- handle_new_user trigger crea el registro en public.usuarios
UPDATE public.usuarios SET rol = 'admin', estado = 'activo' WHERE email = 'admin@icenight.com';
INSERT INTO mesas (numero, capacidad, ubicacion) VALUES (1,4,'VIP'), (2,4,'VIP'), (3,6,'Terraza'), (4,6,'Terraza'), (5,2,'Interior'), (6,2,'Interior'), (7,8,'VIP'), (8,4,'Terraza');
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `openspec/config.yaml` | Modify | Update auth (Supabase Auth) y deploy target (Vercel) |
| `backend/package.json` | Create | Dependencias Fastify + Supabase + pg + Zod + dev deps |
| `backend/tsconfig.json` | Create | TypeScript strict, nodenext, paths |
| `backend/api/index.ts` | Create | Entry point serverless @fastify/aws-lambda |
| `backend/src/core/dominio/*.ts` | Create | 8 archivos: errores, entidades, repositorios |
| `backend/src/infraestructura/db/pool.ts` | Create | Pool pg con service_role |
| `backend/src/infraestructura/db/supabase.ts` | Create | Cliente Supabase admin |
| `backend/src/infraestructura/servicios/supabase-jwt.ts` | Create | Wrapper verify JWT |
| `backend/src/presentacion/controladores/health.ts` | Create | GET /health |
| `backend/src/presentacion/rutas/index.ts` | Create | Registro de rutas |
| `backend/src/presentacion/middleware/auth.ts` | Create | JWT verification |
| `backend/src/presentacion/middleware/autorizacion.ts` | Create | Estado check |
| `backend/src/tipos/dto.ts` | Create | Zod schemas |
| `backend/test/health.test.ts` | Create | Supertest health check |
| `frontend/package.json` | Create | React + Vite + Supabase + dev deps |
| `frontend/tsconfig.json` | Create | Strict TS config |
| `frontend/vite.config.ts` | Create | Proxy /api → backend |
| `frontend/vitest.config.ts` | Create | Vitest config |
| `frontend/src/lib/supabase.ts` | Create | Cliente Supabase browser |
| `frontend/src/App.tsx` | Create | Shell React vacío |
| `frontend/src/main.tsx` | Create | Entry point React |
| `frontend/src/index.css` | Create | Tailwind imports |
| `frontend/index.html` | Create | HTML shell |
| `supabase/migrations/00001_usuarios.sql` | Create | Tabla usuarios + trigger |
| `supabase/migrations/00002_catalog.sql` | Create | Tablas productos, variantes |
| `supabase/migrations/00003_mesas.sql` | Create | Tabla mesas |
| `supabase/migrations/00004_sesiones.sql` | Create | Tablas sesiones, items_sesion |
| `supabase/migrations/00005_inventario.sql` | Create | Tablas compras, items_compra, movimientos_stock |
| `supabase/migrations/00006_rls_policies.sql` | Create | RLS policies |
| `supabase/migrations/seed.sql` | Create | Admin default + mesas de prueba |
| `vercel.json` | Create | Routing /api* → serverless function |
| `.editorconfig` | Create | Editor config |
| `.gitignore` | Create | node_modules, dist, .env |
| `eslint.config.js` | Create | ESLint flat config |
| `.prettierrc` | Create | Prettier config |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Domain errors (clases), repository interfaces | Jest, solo que las clases extienden ErrorDeDominio |
| Integration | GET /health → 200 + body | Supertest contra instancia Fastify sin auth |
| Smoke | tsc --noEmit sin errores | Script CI |

## Migration / Rollout

No migration requerida — base de datos vacía. El seed crea admin default + mesas de prueba. Rollback: `git reset --hard HEAD~1` + DROP manual de tablas si la migración falló.

## Open Questions

- [ ] ¿Pool pg con `service_role` o `anon` key + RLS? Proposal dice `service_role` para operaciones internas. Confirmar.
- [ ] ¿Vercel Pro necesario para cold start aceptable con Fastify serverless?
- [ ] ¿Configurar dominio custom o usar `.vercel.app` en v1?
