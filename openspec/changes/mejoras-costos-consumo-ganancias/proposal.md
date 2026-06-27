# Proposal: Mejoras Costos, Consumo y Ganancias

## Intent

Tres mejoras contables independientes: (1) permitir costo al crear producto sin variantes, (2) editar cantidad de consumo en sesión abierta, (3) mostrar costo y utilidad en dashboard.

## Scope

### In Scope
- **Cambio 1**: Campo `costo` en `CrearProductoSchema`, `CrearProducto` use case, y `ProductFormModal`
- **Cambio 2**: Use case `ActualizarConsumo`, endpoint `PATCH /api/sesiones/:id/items/:itemId`, botón editar cantidad en `SesionPage`
- **Cambio 3**: Costo total y utilidad en `ObtenerHistorialVentas`, nuevos campos en DTO/frontend, 2 nuevas KPIs en `SalesHistorySection`

### Out of Scope
- Editar variante del consumo (cambiar producto)
- Editar costo retroactivo en variantes existentes
- Exportar reporte de ganancias (PDF/CSV)
- Costos en dashboard/hoy

## Capabilities

### New Capabilities
- `gestion-productos`: crear/editar productos con costo en variante única
- `consumo-sesion`: agregar, editar, eliminar items en sesión abierta
- `reporte-ganancias`: historial de ventas con ingresos, costos y utilidad

### Modified Capabilities
None — no existen specs previas (directorio `openspec/specs/` vacío).

## Approach

**C1 — Costo en producto**: agregar `costo?: number` opcional al schema (si no se envía, default `0`). Pasarlo al `CrearProducto` use case y al `save` de variante. Input COP en `ProductFormModal`.

**C2 — Editar consumo**: nuevo use case `ActualizarConsumo` que actualiza `cantidad` (recalcula subtotal). Endpoint `PATCH /api/sesiones/:id/items/:itemId`. Botón "Editar" en fila de consumo que abre inline input de cantidad.

**C3 — Ganancias dashboard**: modificar query SQL de `ObtenerHistorialVentas` para hacer `LEFT JOIN variantes` y calcular `SUM(isel.cantidad * v.costo) AS costo_total`. Enviar `total_costos`, `utilidad` en DTO. Dos nuevas tarjetas KPI en vista.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/tipos/dto.ts` | Modified | `CrearProductoSchema` + `AgregarItemDTO` |
| `backend/src/core/aplicacion/catalogo/CrearProducto.ts` | Modified | Usar `data.costo` en lugar de `0` |
| `backend/src/core/aplicacion/sesiones/AgregarConsumo.ts` | None | Ya calcula subtotal correctamente |
| `backend/src/core/aplicacion/sesiones/ActualizarConsumo.ts` | New | Nuevo use case |
| `backend/src/core/aplicacion/dashboard/ObtenerHistorialVentas.ts` | Modified | JOIN variantes, calcular costos |
| `backend/src/presentacion/controladores/sesiones.ts` | Modified | Handler para actualizar |
| `backend/src/presentacion/rutas/sesiones.ts` | Modified | Ruta PATCH |
| `frontend/src/lib/api.ts` | Modified | Tipos + funciones |
| `frontend/src/components/catalogo/ProductFormModal.tsx` | Modified | Input costo |
| `frontend/src/pages/sesiones/SesionPage.tsx` | Modified | Botón editar cantidad |
| `frontend/src/components/dashboard/SalesHistorySection.tsx` | Modified | KPIs costo/utilidad |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Costo `0` en productos existentes distorsiona utilidad | Medium | Documentar; el usuario puede actualizar cada variante |
| Editar cantidad a 0 debe eliminar item o rechazar | Low | Validar `cantidad >= 1` |
| Query historial más pesado (LEFT JOIN variantes) | Low | Índice en `items_sesion.variante_id` ya existe |

## Rollback Plan

Revert commits por cambio independiente. Git revert en orden inverso: C3 → C2 → C1. Sin cambios de esquema — solo código y DTOs.

## Dependencies

Ninguna.

## Success Criteria

- [ ] C1: Crear producto sin variantes con costo → variante guarda `costo > 0`
- [ ] C2: PATCH /api/sesiones/:id/items/:id actualiza cantidad y subtotal
- [ ] C2: SesionPage muestra botón editar en cada fila, permite cambiar cantidad
- [ ] C3: Historial ventas devuelve `total_costos` y `utilidad` por período
- [ ] C3: SalesHistorySection muestra costo total y utilidad como KPIs
