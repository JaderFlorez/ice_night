# Especificación: Gestión de Productos

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
