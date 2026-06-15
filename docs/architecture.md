# Arquitectura — ICE NIGHT ERP

## Vista General: Flujo de 3 Capas

```mermaid
flowchart LR
    subgraph Frontend ["Frontend (Vercel)"]
        React["React + Vite + Tailwind"]
        SupaClient["@supabase/supabase-js<br/>(anon key)"]
    end

    subgraph Backend ["Backend (Vercel Serverless)"]
        Fastify["Fastify API<br/>(@fastify/aws-lambda)"]
        Middleware["Middleware Chain<br/>auth → autorización → admin"]
        Controllers["Controllers / Handlers"]
    end

    subgraph Supabase ["Supabase"]
        Auth["Supabase Auth<br/>(signUp, signIn, JWT)"]
        PG[("Postgres<br/>(pool pg directo)")]
    end

    %% Auth flow: frontend → Supabase Auth directo
    React -->|signUp / signIn| Auth
    Auth -->|JWT + session| React

    %% Business flow: frontend → Fastify → Supabase PG
    React -->|GET /api/*<br/>Authorization: Bearer JWT| Fastify
    Fastify --> Middleware
    Middleware --> Controllers
    Controllers -->|supabase.auth.getUser| Auth
    Controllers -->|queries SQL con pg pool| PG
    PG -->|rows| Controllers
    Controllers -->|JSON response| React
```

> **Nota**: El frontend se comunica DIRECTAMENTE con Supabase Auth para registro/login.  
> El backend solo verifica JWTs y maneja datos de negocio en `public` tables.  
> Ver [auth-flow.md](flows/auth-flow.md) para el detalle completo.

---

## Clean Architecture — Capas

```mermaid
flowchart TB
    subgraph Presentacion ["Presentación (adapters HTTP)"]
        Rutas["rutas/<br/>endpoint definitions"]
        Middleware["middleware/<br/>auth · autorización · admin"]
        Controladores["controladores/<br/>request → response"]
    end

    subgraph Infraestructura ["Infraestructura (implementaciones)"]
        DB["db/<br/>pool.ts · supabase.ts"]
        Repos["repositorios/<br/>UsuarioRepo · ProductoRepo ..."]
        Servicios["servicios/<br/>supabase-jwt.ts"]
    end

    subgraph Aplicacion ["Aplicación (use cases)"]
        UseCases["casos de uso/<br/>AbrirSesion · CerrarSesion<br/>AprobarUsuario · etc."]
    end

    subgraph Dominio ["Dominio (entidades + contratos)"]
        Entidades["entidades/<br/>Usuario · Producto · Variante<br/>Mesa · Sesion · Compra"]
        Errores["errores/<br/>ErrorDeDominio y subclases"]
        Repositorios["repositorios.ts<br/>(interfaces/ports)"]
    end

    %% Dependencias: afuera → adentro
    Presentacion -->|"depende de"| Aplicacion
    Presentacion -->|"depende de"| Infraestructura
    Aplicacion -->|"depende de"| Dominio
    Infraestructura -->|"implementa"| Dominio

    style Dominio fill:#1a1a2e,color:#fff,stroke:#4a4a8e
    style Aplicacion fill:#16213e,color:#fff,stroke:#4a8ec9
    style Infraestructura fill:#0f3460,color:#fff,stroke:#53a8b6
    style Presentacion fill:#533483,color:#fff,stroke:#e94560
```

### Reglas de dependencia

| Dirección | Permitido | Prohibido |
|-----------|-----------|-----------|
| **Dominio** → nada | Depende solo de TypeScript stdlib | No importa de infraestructura, frameworks, DB |
| **Aplicación** → Dominio | Importa entidades, interfaces de repositorio, errores | No importa de Express/Fastify, DB drivers, HTTP |
| **Infraestructura** → Dominio | Implementa interfaces de repositorio, servicios | No define nuevas entidades de negocio |
| **Presentación** → Aplicación + Infraestructura | Conecta rutas con casos de uso y middleware | No contiene lógica de negocio |

---

## Middleware Chain

Toda request protegida pasa por una cadena de middlewares en orden estricto:

```mermaid
flowchart LR
    Request["Request entrante"] --> Auth["authMiddleware<br/>Verificar JWT con Supabase"]
    Auth -->|"válido"| Autorizacion["autorizacionMiddleware<br/>usuarios.estado === 'activo'"]
    Auth -->|"inválido"| 401["401 Token requerido/inválido"]
    Autorizacion -->|"activo"| Admin{"adminMiddleware<br/>(solo rutas admin)"}
    Autorizacion -->|"pendiente/rechazado"| 403["403 Usuario no activo"]
    Admin -->|"es admin"| Handler["Handler del controlador"]
    Admin -->|"no es admin"| 403Admin["403 Se requieren permisos de admin"]
```

### Middleware por ruta

| Ruta | authMiddleware | autorizacionMiddleware | adminMiddleware |
|------|:---:|:---:|:---:|
| `GET /api/health` | — | — | — |
| `GET /api/auth/perfil` | ✅ | — | — |
| `GET /api/admin/usuarios/pendientes` | ✅ | ✅ | ✅ |
| `PATCH /api/admin/usuarios/:id/estado` | ✅ | ✅ | ✅ |
| Rutas protegidas futuras | ✅ | ✅ | — |

> **Nota**: `GET /api/auth/perfil` NO requiere autorización activa — los usuarios con estado `pendiente` necesitan consultar su perfil para saber si fueron aprobados.

---

## Arquitectura de Deploy (Vercel Serverless)

```mermaid
flowchart TB
    subgraph Vercel ["Vercel (unified deploy)"]
        direction TB
        CDN["CDN Edge"]
        
        subgraph FrontendApp ["Frontend App"]
            HTML["index.html"]
            Assets["static assets (JS/CSS)"]
        end

        subgraph Serverless ["Serverless Function"]
            APILambda["api/index.ts<br/>(@fastify/aws-lambda)"]
            FastifyInst["Instancia Fastify<br/>(pool pg con lifetime)"]
        end
    end

    subgraph SupabaseCloud ["Supabase"]
        PGSupabase[("Postgres<br/>(pool con service_role)")]
        SupaAuth["Supabase Auth API"]
    end

    User["Usuario/Browser"] -->|"www.icenight.vercel.app"| CDN
    CDN -->|"/"| FrontendApp
    CDN -->|"/api/*"| APILambda
    FrontendApp -->|"supabase.auth.*"| SupaAuth
    APILambda --> FastifyInst
    FastifyInst -->|"pool.query"| PGSupabase
    FastifyInst -->|"supabase.auth.getUser"| SupaAuth
```

### Configuración Vercel

```json
{
  "buildCommand": "cd backend && npm run build",
  "outputDirectory": "backend/dist",
  "functions": {
    "api/index.ts": { "maxDuration": 10 }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/api" }
  ]
}
```

> **Nota**: `vercel.json` actualmente redirige TODAS las rutas al backend.  
> Esto es temporal — cuando el frontend esté listo, las rutas estáticas deben ir al frontend y solo `/api/*` al backend.

### Pool de conexiones

- El pool pg se crea con `service_role` key (bypassea RLS para operaciones internas)
- Usa `max: 1` con `idleTimeoutMillis: 30000` — seguro para serverless
- Vercel mantiene la instancia caliente entre requests (el pool no se destruye en cada invocación)

---

## Decisiones de Diseño

| # | Decisión | Opción elegida | Alternativa descartada | Rationale |
|---|----------|---------------|----------------------|-----------|
| D1 | **Auth provider** | Supabase Auth (frontend direct) | Custom JWT + proxy por Fastify | Supabase maneja refresh tokens, MFA, password reset OOTB. Menos superficie de seguridad. |
| D2 | **DB driver** | `pg` directo (pool) | `@supabase/supabase-js` para queries | pg es más rápido (conexión directa TCP vs REST). `supabase-js` solo para verificar JWT. |
| D3 | **Deploy target** | Vercel (unified) | Railway, Fly.io | Frontend + backend en mismo proveedor. Aceptamos cold start de Fastify. |
| D4 | **Pool en serverless** | Pool con lifetime por instancia | Pool efímero (crear/destruir por request) | Vercel mantiene la instancia caliente. Pool persistente reduce latency. |
| D5 | **Nombres de dominio** | Español para entidades y use cases | Inglés | Lenguaje ubicuo del negocio. Código auto-documentado para el equipo. |
| D6 | **Auth state frontend** | React Context + `onAuthStateChange` | Zustand, Redux | El estado es simple (session + perfil). Context es suficiente. No justifica dependencia extra. |
| D7 | **Precios en sesiones** | Snapshot en `item_sesion.precio_unitario` | JOIN con `variantes.precio` en cada GET | El precio puede cambiar entre rondas. Cada consumo se cobra al precio de ese momento. |
| D8 | **Stock deduction** | `SELECT FOR UPDATE` transaccional | Descuento optimista sin lock | Evita race conditions cuando dos sesiones se cierran simultáneamente. |
| D9 | **Total de sesión** | Calculado vía `SUM(items_sesion.subtotal)` en cada GET | Cacheado en `sesion.total` | Simple, siempre actualizado. Postgres maneja SUM eficientemente con índice. |

---

## Estructura de directorios

```
backend/
├── api/index.ts                       ← Entry point serverless
├── src/
│   ├── core/
│   │   ├── dominio/                   ← Entidades + errores + interfaces repositorio
│   │   └── aplicacion/                ← Casos de uso (vacíos en scaffold)
│   ├── infraestructura/
│   │   ├── db/                        ← Pool pg, cliente Supabase admin
│   │   ├── repositorios/              ← Implementaciones de repositorios
│   │   └── servicios/                 ← JWT verification wrapper
│   ├── presentacion/
│   │   ├── controladores/             ← Handlers HTTP
│   │   ├── rutas/                     ← Definición de rutas Fastify
│   │   └── middleware/                ← auth, autorización, admin
│   └── tipos/                         ← DTOs (Zod schemas)
├── test/
└── package.json

frontend/
├── src/
│   ├── lib/                           ← Cliente Supabase browser
│   ├── context/                       ← AuthProvider
│   ├── components/                    ← Componentes compartidos
│   ├── pages/                         ← Páginas de la app
│   ├── App.tsx                        ← Router + layout
│   └── main.tsx                       ← Entry point
├── index.html
└── package.json

supabase/
└── migrations/                        ← Migraciones SQL secuenciales
```

## Módulos y dependencias

```mermaid
flowchart TB
    Auth[("Auth<br/>(usuarios)")]
    Catalog[("Catalog<br/>(productos, variantes)")]
    Tables[("Tables<br/>(mesas)")]
    Inventory[("Inventory<br/>(compras, movimientos)")]
    Sessions[("Sessions<br/>(sesiones, items)")]
    Dashboard[("Dashboard<br/>(KPIs)")]

    Auth --> Catalog
    Auth --> Tables
    Auth --> Sessions
    Catalog --> Sessions
    Catalog --> Inventory
    Tables --> Sessions
    Sessions --> Dashboard
    Inventory --> Dashboard
```

## Entidades de dominio

| Entidad | Descripción |
|---------|-------------|
| `Usuario` | Persona que usa el sistema (admin o mesero). |
| `Producto` | Item del catálogo (cerveza, michelada, soda, snack, otro). |
| `Variante` | Especificación de un producto (sabor, marca, tipo). Tiene precio, costo, stock. |
| `Mesa` | Mesa física en la discoteca. |
| `Sesion` | Cuenta abierta en una mesa. Una mesa SOLO puede tener una sesión abierta. |
| `ItemSesion` | Consumo registrado en una sesión (producto + cantidad + precio snapshot). |
| `Compra` | Reposición de inventario. |
| `ItemCompra` | Producto comprado en una reposición. |
| `MovimientoStock` | Registro de entrada/salida de stock (compra, venta, ajuste). |
