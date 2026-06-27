# ICE NIGHT ERP — Documentación

Sistema de gestión integral para **ICE NIGHT**, una discoteca/nightclub.  
ERP con frontend React, backend Fastify (serverless), y Supabase Postgres + Auth.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 |
| Backend | Fastify (serverless via `@fastify/aws-lambda` en Vercel) |
| Base de datos | Supabase Postgres (pool pg directo) |
| Autenticación | Supabase Auth + JWT verification en Fastify |
| Validación | Zod |
| Tests | Jest + Supertest (backend), Vitest + RTL (frontend) |
| Arquitectura | Clean Architecture (Repository + Use Case patterns) |
| Lenguaje de dominio | Español (entidades, errores, casos de uso) |

## Documentos disponibles

| Documento | Descripción |
|-----------|-------------|
| [architecture.md](architecture.md) | Arquitectura general: diagramas de flujo, capas, middleware, decisiones de diseño |
| [database/schema.md](database/schema.md) | Schema completo: ERD, tablas, columnas, constraints, índices, triggers |
| [database/rls-policies.md](database/rls-policies.md) | Políticas de seguridad Row Level Security por tabla y rol |
| [flows/auth-flow.md](flows/auth-flow.md) | Flujo de autenticación: registro, login, aprobación de admin, route guards |

## Enlaces rápidos

- **Frontend dev**: `http://localhost:5173`
- **Backend dev**: `http://localhost:3000`
- **Health check**: `GET /api/health`
- **API Base (prod)**: `https://ice-night-erp.vercel.app/api`

## Convenciones

- **Entidades de dominio**: en español (`Usuario`, `Sesion`, `Producto`, `Variante`, `Mesa`, `Compra`)
- **Tipos/DTOs técnicos**: en inglés (`CreateProductoDTO`, `LoginSchema`)
- **Casos de uso**: verbos en español (`AbrirSesion`, `CerrarSesion`, `AprobarUsuario`)
- **Base de datos**: tablas en español y plural (`usuarios`, `productos`, `sesiones`)
- **Commits**: convencionales en inglés (`feat:`, `fix:`, `docs:`)
