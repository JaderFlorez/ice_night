# 🧊 ICE NIGHT — ERP para Gestión de Discotecas y Clubes Nocturnos

ICE NIGHT es un sistema integral de tipo ERP diseñado para la gestión operativa y administrativa en tiempo real de discotecas, bares y clubes nocturnos. El sistema optimiza el flujo de comisiones de meseros, control de inventario de licores por variantes, apertura de cuentas por mesa y la administración centralizada de la caja.

## 🚀 Arquitectura y Enfoque Técnico

El proyecto está construido bajo los principios de **Clean Architecture** (Arquitectura Limpia), garantizando la separación estricta de responsabilidades, la testabilidad del código y la independencia de la base de datos o frameworks de terceros.

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite 6 |
| **Backend** | Node.js, Fastify, TypeScript (Serverless en Vercel) |
| **Base de Datos y Auth** | Supabase (PostgreSQL) con RLS |
| **Validación** | Zod |
| **Tests** | Jest + Supertest (backend), Vitest + React Testing Library (frontend) |
| **Despliegue** | Vercel (Frontend + Backend Serverless con `@fastify/aws-lambda`) |

### Flujo de Arquitectura

```
[ React + Vite (Vercel) ] ──► [ Supabase Auth ] (login/register directo)
         │
  Authorization: Bearer JWT
         ▼
[ Fastify Serverless (Vercel) ] ──► [ Supabase DB + RLS ]
```

---

## 📁 Estructura del Proyecto

```text
├── backend/                          # Servidor Fastify (Clean Architecture)
│   ├── api/                          # Adaptador Serverless para Vercel
│   ├── src/
│   │   ├── core/
│   │   │   ├── dominio/              # Entidades, Value Objects, Repository interfaces
│   │   │   └── aplicacion/           # Casos de uso (ObtenerPerfil, AprobarUsuario, etc.)
│   │   ├── infraestructura/
│   │   │   ├── db/                   # Pool pg + Supabase admin client
│   │   │   ├── repositorios/         # Implementaciones de repositorios
│   │   │   └── servicios/            # JWT verification service
│   │   ├── presentacion/
│   │   │   ├── controladores/        # Route handlers
│   │   │   ├── rutas/                # Definición de rutas
│   │   │   └── middleware/           # auth, autorizacion, admin
│   │   └── tipos/                    # Zod schemas / DTOs
│   └── test/                         # Pruebas unitarias y de integración
├── frontend/                         # Aplicación SPA (React + TypeScript)
│   └── src/
│       ├── context/                  # AuthProvider + hooks (useAuth, useIsAdmin)
│       ├── components/
│       │   ├── auth/                 # Route guards (PublicRoute, ProtectedRoute, AdminRoute)
│       │   └── layout/               # AppLayout (sidebar responsive + header)
│       ├── pages/
│       │   ├── auth/                 # LoginPage, RegisterPage, PendingApprovalPage
│       │   └── admin/                # UserManagementPage
│       └── lib/                      # Cliente Supabase + API helpers
├── supabase/                         # Migraciones SQL y políticas RLS
│   └── migrations/                   # 7 migraciones (usuarios → RLS policies + seed)
├── docs/                             # Documentación profesional
│   ├── architecture.md               # Diagramas de arquitectura
│   ├── openapi.yaml                  # Especificación OpenAPI 3.0
│   ├── database/                     # Schema DB + RLS policies
│   └── flows/                        # Diagramas de flujo (auth, etc.)
├── openspec/                         # Artefactos SDD (especificaciones, diseños, tareas)
└── vercel.json                       # Configuración global para despliegue serverless
```

---

## 🔐 Estado de los Módulos del Sistema

### 1. Base del Proyecto & Scaffold [✅ Completado]

Configuración de entornos de TypeScript (`tsc --noEmit`), ESLint, Prettier, EditorConfig y reglas globales de editor.

Estructura Clean Architecture completa con entidades de dominio (Usuario, Producto, Variante, Mesa, Sesion, ItemSesion, Compra, MovimientoStock), interfaces de repositorio, errores de dominio, y Zod DTOs.

Enrutamiento base, health check, pool de conexión a Supabase, y despliegue agnóstico mediante `vercel.json`.

### 2. Control de Acceso y Autenticación [✅ Completado]

- Integración nativa con **Supabase Auth** (Flujo de registro instantáneo sin confirmación obligatoria de correo).
- Implementación de **Row Level Security (RLS)** directamente en PostgreSQL mediante funciones de seguridad con `SECURITY DEFINER`.
- **Trigger `on_auth_user_created`**: sincronización automática entre `auth.users` y `public.usuarios`.
- Primer usuario registrado se convierte en **admin automáticamente**.
- **Route Guards en Frontend** — Flujo estricto de aprobación de usuarios:
  ```
  Registro ──► Estado Pendiente (Bloqueo de UI con polling automático cada 10s)
       ──► Aprobación del Admin ──► Estado Activo
  ```
- **Middleware en backend** en 3 capas:
  - `authMiddleware` — verifica JWT de Supabase
  - `autorizacionMiddleware` — verifica que el usuario esté activo
  - `adminMiddleware` — verifica que el usuario sea administrador
- Endpoints: `GET /api/auth/perfil`, `GET /api/admin/usuarios/pendientes`, `PATCH /api/admin/usuarios/:id/estado`

### 3. Catálogo de Productos y Variantes [⏳ Próximo Módulo — Change 2]

CRUD completo de productos lógicos con soporte para variantes multi-precio (ej: michelada→sabores: tamarindo, mango, clásica; cerveza→marcas: Águila, Corona, etc.).

### 4. Mesas y Sesiones de Consumo [📅 Planeado]

Monitoreo del estado de las mesas (Libre, Ocupada). Apertura de sesiones vinculadas al mesero responsable bajo políticas RLS restrictivas. Cuenta acumulada con rondas y snapshot de precios.

### 5. Inventario y Stock [📅 Planeado]

Auditoría de movimientos de stock (Entradas por compras, salidas automáticas por ventas). Alertas de stock mínimo. Control de stock por variante.

### 6. Dashboard Administrativo [📅 Planeado]

Métricas de ventas en tiempo real, productos más vendidos, ganancia bruta, y comisiones acumuladas por mesero.

---

## 🛠️ Instalación y Configuración Local

### Requisitos Previos

- Node.js 18+
- npm 10+
- Cuenta activa en [Supabase](https://supabase.com)

### Pasos de Inicialización

**1. Clonar el repositorio:**

```bash
git clone https://github.com/tu-usuario/ice-night.git
cd ice-night
```

**2. Instalar dependencias:**

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

**3. Configurar variables de entorno:**

`backend/.env`:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_DB_URL=postgresql://postgres:password@db.tu-proyecto.supabase.co:5432/postgres
PORT=3000
```

`frontend/.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

**4. Aplicar migraciones a la base de datos:**

Ejecutar cada archivo en orden desde el SQL Editor de Supabase Dashboard:

| Orden | Archivo | Descripción |
|-------|---------|-------------|
| 1 | `supabase/migrations/00001_usuarios.sql` | Tabla usuarios + triggers |
| 2 | `supabase/migrations/00002_catalog.sql` | Productos + variantes |
| 3 | `supabase/migrations/00003_mesas.sql` | Mesas |
| 4 | `supabase/migrations/00004_sesiones.sql` | Sesiones + items |
| 5 | `supabase/migrations/00005_inventario.sql` | Compras + movimientos stock |
| 6 | `supabase/migrations/00006_rls_policies.sql` | Políticas RLS |
| 7 | `supabase/migrations/seed.sql` | Datos de prueba |

> **Importante:** Desactivar "Confirm email" en Supabase Dashboard → Authentication → Settings para que los usuarios se registren sin verificar email.

**5. Iniciar entorno de desarrollo:**

```bash
# Terminal 1 — Backend (Fastify en puerto 3000)
cd backend
npm run dev

# Terminal 2 — Frontend (Vite en puerto 5173)
cd frontend
npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173) en el navegador.

**6. Ejecutar tests:**

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## 🧪 Flujo de Prueba Rápido

1. **Registrar primer usuario** en `/register` → se convierte en `admin` automáticamente
2. **Registrar segundo usuario** → queda como `pendiente` (redirige a pantalla de espera)
3. **Iniciar sesión como admin** → ir a Admin → aprobar al segundo usuario
4. **Iniciar sesión como el segundo usuario** → ahora puede acceder al dashboard

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](docs/architecture.md) | Diagramas de flujo, capas, middleware, decisiones de diseño |
| [API Spec](docs/openapi.yaml) | Especificación OpenAPI 3.0 de todos los endpoints |
| [Base de Datos](docs/database/schema.md) | ERD, tablas, índices, triggers |
| [RLS Policies](docs/database/rls-policies.md) | Políticas de seguridad por tabla y rol |
| [Auth Flow](docs/flows/auth-flow.md) | Flujo de autenticación completo con diagramas |

---

## 📄 Licencia

Privado — uso interno de ICE NIGHT.
