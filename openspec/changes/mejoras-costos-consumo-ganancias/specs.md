# Especificación: Mejoras Costos, Consumo y Ganancias

## Dominio: gestion-productos

### Purpose
Productos sin variantes registran un costo base opcional, almacenado en la variante única y visible en la UI.

### Requirements

#### Requirement: Costo opcional en creación (GP-01)
The system MUST accept optional `costo: number` (≥0) when creating a product without variants, defaulting to `0` when omitted.

**Scenario: Costo proporcionado** — GIVEN creación de producto sin variantes WHEN `costo = 25000` THEN variante "Único" se crea con `costo = 25000`

**Scenario: Costo omitido** — GIVEN creación de producto sin variantes WHEN no se envía `costo` THEN variante "Único" se crea con `costo = 0`

#### Requirement: Costo en actualización (GP-02)
The system MUST accept optional `costo` when updating a product, updating the auto-created variant.

**Scenario: Actualizar costo** — GIVEN producto existente con `costo = 0` WHEN se actualiza con `costo = 30000` THEN variante se actualiza a `costo = 30000`

#### Requirement: Visualización de costo (GP-03)
The system SHOULD display `costo` formateado en COP junto al precio en formularios y detalle.

**Scenario: Input en formulario** — GIVEN producto con `costo = 25000` WHEN `ProductFormModal` se abre THEN muestra input numérico COP para costo

**Scenario: Detalle de producto** — GIVEN producto con `costo = 25000` WHEN `ProductDetailPage` se abre THEN costo se muestra formateado en COP

## Dominio: consumo-sesion

### Purpose
Los items en sesión abierta pueden editar su cantidad, recalculando subtotal automáticamente.

### Requirements

#### Requirement: Editar cantidad de consumo (CS-01)
The system MUST validate session is open, update `cantidad`, recalculate `subtotal = cantidad * precio_unitario`.

**Scenario: Cantidad válida** — GIVEN sesión abierta, item `cantidad = 2`, `precio_unitario = 15000` WHEN `PATCH` con `{ cantidad: 4 }` THEN item actualiza a `cantidad = 4`, `subtotal = 60000`

**Scenario: Sesión cerrada** — GIVEN sesión cerrada WHEN se intenta editar un item THEN sistema rechaza con 422

**Scenario: Cantidad inválida** — GIVEN sesión abierta WHEN `cantidad = 0` THEN sistema rechaza con 422 (< 1)

#### Requirement: UI de edición en SesionPage (CS-02)
The system SHOULD provide inline edit with quantity input in each row when session is open.

**Scenario: Botones editar/eliminar** — GIVEN sesión abierta con items THEN cada fila muestra botones "Editar" y "Eliminar"

**Scenario: Editar inline con guardar/cancelar** — GIVEN usuario hace clic en "Editar" THEN cantidad se vuelve input con botones "Guardar"/"Cancelar" WHEN confirma THEN se envía `PATCH` y UI refleja cambio

## Dominio: reporte-ganancias

### Purpose
Dashboard de historial de ventas incorpora costo total de productos vendidos y utilidad neta (ingreso - costo).

### Requirements

#### Requirement: Cálculo de costos en historial (RG-01)
The system MUST calculate `costo_total = SUM(items_sesion.cantidad * variantes.costo)` and `utilidad = total_recaudado - costo_total` via `LEFT JOIN variantes`.

**Scenario: Costos registrados** — GIVEN período con productos con costo WHEN se consulta historial THEN respuesta incluye `total_costos` y `utilidad = total_recaudado - total_costos`

**Scenario: Costos mixtos** — GIVEN período con productos de `costo = 0` y `costo > 0` WHEN se consulta historial THEN `total_costos` suma solo costos conocidos

#### Requirement: KPIs y desglose en UI (RG-02)
The system SHOULD display "Costo total" y "Utilidad" as KPI cards and per-period columns in the breakdown table.

**Scenario: KPIs en dashboard** — GIVEN dashboard con historial cargado WHEN datos incluyen `total_costos` y `utilidad` THEN `SalesHistorySection` muestra tarjetas "Costo total" y "Utilidad"

**Scenario: Desglose por período** — GIVEN tabla de desglose por período WHEN datos incluyen costos/utilidad por período THEN tabla incluye ambas columnas
