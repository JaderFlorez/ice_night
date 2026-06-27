# Design: Mejoras Costos, Consumo y Ganancias

## Technical Approach

Tres cambios independientes en capas aisladas: (C1) costo opcional en schema/variante, (C2) nuevo use case + endpoint + update en repositorio, (C3) extensión de query historial + DTOs + frontend. Sin migraciones de esquema — solo código y tipos.

## Architecture Decisions

### C1 — Costo opcional en `CrearProducto`

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Campo obligatorio `costo` | Rompe API existente, clientes deben enviar `0` | ❌ |
| **Campo opcional con default `0`** | Backward compatible, mínimo cambio por capa | ✅ |
| Schema separado para crear con costo | Duplica validación, más mantenimiento | ❌ |

### C2 — `update()` en `ItemSesionRepositorio`

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| **`update(id, Partial<ItemSesion>)`** | Sigue patrón de `VarianteRepositorio.update` y `ProductoRepositorio.update` | ✅ |
| DELETE + INSERT | Pierde `creado_en`, 2 queries vs 1, riesgo de perder datos | ❌ |
| SQL directo en use case | Rompe Clean Architecture, mezcla capas | ❌ |

### C3 — Cálculo de costos en query SQL

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| **LEFT JOIN variantes en query existente** | Una query, sin cambios de esquema, sigue patrón actual | ✅ |
| Calcular en TypeScript post-query | N+1 potencial (cada item sesión → lookup variante), más código | ❌ |
| Vista materializada en DB | Overkill para MVP, desacople innecesario | ❌ |

## Data Flow

### C2 — ActualizarConsumo

```
Cliente → PATCH /api/sesiones/:sesionId/items/:itemId
           Body: { cantidad: number }
              ↓
         [sesiones.ts handler]
           parse via ActualizarItemSchema (cantidad >= 1)
              ↓
         [ActualizarConsumo use case]
           sesionRepo.findById(sesionId)
             ├─ null → SesionNoEncontrada (404)
             ├─ estado=cerrada → SesionYaCerrada (409)
             └─ ok → continue
           itemRepo.findById(itemId)
             ├─ null o item.sesion_id !== sesionId → Error (404)
             └─ ok → recalcula subtotal = item.precio_unitario * cantidad
           itemRepo.update(itemId, { cantidad, subtotal })
              ↓
         Response 200: { data: ItemSesionDTO actualizado }
```

### C3 — Costos en historial (modificación query existente)

```
ObtenerHistorialVentas
  ─→ pool.query(SQL con LEFT JOIN variantes)
  ─→ por cada fila: total, sesiones, items, costo → costo total, utilidad = SUM(total) - SUM(costo)
  ─→ HistorialVentasDTO { total_costos, utilidad, desglose: [{... , costo, utilidad}] }
  ─→ SalesHistorySection: 2 nuevas KPIs + columnas en tabla
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/tipos/dto.ts` | Modify | `CrearProductoSchema` + `ActualizarProductoSchema`: add `costo?: number().min(0)`. New `ActualizarItemSchema`. |
| `backend/src/core/aplicacion/catalogo/CrearProducto.ts` | Modify | `costo: data.costo ?? 0` en vez de `0` hardcoded |
| `backend/src/core/dominio/repositorios.ts` | Modify | `ItemSesionRepositorio`: add `update(id, Partial<ItemSesion>): Promise<void>` |
| `backend/src/infraestructura/repositorios/item-sesion-repositorio.ts` | Modify | Implement `update()` con `UPDATE items_sesion SET ... WHERE id = $1` |
| `backend/src/core/aplicacion/sesiones/ActualizarConsumo.ts` | Create | New use case: valida sesión/ítem, recalcula subtotal, guarda |
| `backend/src/presentacion/controladores/sesiones.ts` | Modify | Handler para `actualizarConsumo`, import y lazy init del use case |
| `backend/src/presentacion/rutas/sesiones.ts` | Modify | Ruta `PATCH /api/sesiones/:sesionId/items/:itemId` |
| `backend/src/core/aplicacion/dashboard/ObtenerHistorialVentas.ts` | Modify | LEFT JOIN variantes, `SUM(cantidad * costo)` AS costo, DTOs extendidos |
| `frontend/src/lib/api.ts` | Modify | `CrearProductoData` + `ActualizarProductoData`: add `costo?`. New `HistorialVentasDTO`/`HistorialVentaDetalleDTO` campos. New `actualizarConsumo()` function. |
| `frontend/src/components/catalogo/ProductFormModal.tsx` | Modify | Input COP para costo entre precio y stock (solo sin variantes) |
| `frontend/src/pages/sesiones/SesionPage.tsx` | Modify | Botón "Editar" por fila → inline input cantidad + save/cancel |
| `frontend/src/components/dashboard/SalesHistorySection.tsx` | Modify | 2 nuevas KPIs (costo total, utilidad), columnas costo/utilidad en tabla |

## Interfaces / Contracts

### Repositorio — nuevo método

```typescript
// backend/src/core/dominio/repositorios.ts
export interface ItemSesionRepositorio {
  findBySesion(sesionId: string): Promise<ItemSesion[]>;
  findById(id: string): Promise<ItemSesion | null>;
  save(item: ItemSesion): Promise<void>;
  update(id: string, data: Partial<ItemSesion>): Promise<void>;  // NEW
  delete(id: string): Promise<void>;
}
```

### Schema — nuevo

```typescript
// backend/src/tipos/dto.ts
export const ActualizarItemSchema = z.object({
  cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
});
export type ActualizarItemDTO = z.infer<typeof ActualizarItemSchema>;
```

### DTOs modificados — C3

```typescript
// backend/src/core/aplicacion/dashboard/ObtenerHistorialVentas.ts
export interface DesgloseVentaDTO {
  fecha: string;
  sesiones: number;
  total: number;
  costo: number;     // NEW
  utilidad: number;  // NEW
}

export interface HistorialVentasDTO {
  periodo: string;
  total_sesiones: number;
  total_recaudado: number;
  productos_vendidos: number;
  total_costos: number;   // NEW
  utilidad: number;       // NEW
  desglose: DesgloseVentaDTO[];
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — C1 | `CrearProducto.ejecutar` con/sin costo | Mock repos, assert costo en variante |
| Unit — C2 | `ActualizarConsumo.ejecutar` — sesión no encontrada, cerrada, item no pertenece, éxito | Mock repos, assert update called con subtotal recalculado |
| Unit — C3 | `ObtenerHistorialVentas` query returns costo/utilidad correctos | app.inject + DB test o integración |
| Integration — C2 | `PATCH /api/sesiones/:id/items/:itemId` full flow | app.inject con DB real |
| Integration — C3 | `GET /api/dashboard/historial-ventas?periodo=month` devuelve nuevos campos | app.inject con DB real |
| Frontend — C1 | `ProductFormModal` renderiza input costo solo sin variantes | Component test |
| Frontend — C2 | `SesionPage` muestra botón editar, inline input, llama PATCH | Component test + mocked fetch |
| Frontend — C3 | `SalesHistorySection` renderiza KPIs y columnas nuevas | Component test + mocked data |

## Migration / Rollout

No migration required. `costo` default `0` en variantes existentes — la utilidad será precisa solo para productos nuevos con costo cargado. Se puede actualizar costo retroactivo vía edición de variante existente (ya implementado en `ActualizarVariante`). Rollback: revertir commits por cambio (C3 → C2 → C1).

## Open Questions

- [ ] ¿Validar que `costo <= precio` al crear producto? La propuesta no lo pide, pero previene utilidades negativas.
- [ ] ¿Notificar al usuario si edita cantidad a 0 (rechazar) vs eliminar el item? Decisión: rechazar (cantidad >= 1).
