# Especificación: Consumo en Sesión

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
