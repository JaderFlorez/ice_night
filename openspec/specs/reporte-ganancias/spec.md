# Especificación: Reporte de Ganancias

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
