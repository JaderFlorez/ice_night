# Schema de Base de Datos — ICE NIGHT ERP

Base de datos **PostgreSQL** en Supabase. 9 tablas en el schema `public`, más la tabla `auth.users` manejada por Supabase Auth.

---

## Diagrama ERD

```mermaid
erDiagram
    auth_users["auth.users<br/>(Supabase Auth)"] ||--o| public_usuarios["public.usuarios"] : "id → id"
    public_usuarios ||--o{ sesiones : "atiende como mesero"
    mesas ||--o{ sesiones : "tiene"
    sesiones ||--o{ items_sesion : "contiene"
    productos ||--o{ variantes : "tiene"
    variantes ||--o{ items_sesion : "se consume"
    variantes ||--o{ items_compra : "se compra"
    variantes ||--o{ movimientos_stock : "tiene movimientos"
    compras ||--o{ items_compra : "contiene"

    auth_users {
        uuid id PK
    }

    public_usuarios {
        uuid id PK
        text email "email único"
        text nombre
        enum rol "admin | mesero"
        enum estado "pendiente | activo | rechazado"
        timestamptz created_at
    }

    productos {
        uuid id PK
        text nombre
        text descripcion "nullable"
        enum categoria "cerveza | michelada | soda | snack | otro"
        boolean tiene_variantes
        boolean activo
        timestamptz created_at
    }

    variantes {
        uuid id PK
        uuid producto_id FK
        text nombre
        text sku UK
        numeric precio
        numeric costo
        int stock
        int stock_minimo
        boolean activa
        timestamptz created_at
    }

    mesas {
        uuid id PK
        int numero UK
        int capacidad
        text ubicacion "nullable"
        boolean activa
        timestamptz created_at
    }

    sesiones {
        uuid id PK
        uuid mesa_id FK
        uuid mesero_id FK
        enum estado "abierta | cerrada"
        timestamptz abierta_en
        timestamptz cerrada_en "nullable"
        text metodo_pago "nullable"
        numeric total "nullable"
    }

    items_sesion {
        uuid id PK
        uuid sesion_id FK
        uuid variante_id FK
        int cantidad
        numeric precio_unitario "snapshot"
        numeric subtotal
        timestamptz creado_en
    }

    compras {
        uuid id PK
        text proveedor "nullable"
        text notas "nullable"
        numeric costo_total
        timestamptz creado_en
    }

    items_compra {
        uuid id PK
        uuid compra_id FK
        uuid variante_id FK
        int cantidad
        numeric costo_unitario
        numeric subtotal
    }

    movimientos_stock {
        uuid id PK
        uuid variante_id FK
        int cantidad "!= 0; positivo=entrada, negativo=salida"
        enum tipo "compra | venta | ajuste"
        uuid referencia_id "nullable"
        timestamptz creado_en
    }
```

---

## Tablas

### 1. `auth.users`

Manejada por Supabase Auth. No se modifica directamente desde la aplicación.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `UUID` | Primary Key |
| `email` | `TEXT` | Email del usuario |
| `raw_user_meta_data` | `JSONB` | Metadatos (nombre, etc.) |

> **Trigger**: `on_auth_user_created` inserta automáticamente en `public.usuarios` cuando se crea un usuario en `auth.users`.

---

### 2. `public.usuarios`

Registro de negocio de cada usuario del sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK REFERENCES auth.users(id) ON DELETE CASCADE` | Misma ID que auth.users |
| `email` | `TEXT` | `NOT NULL` | Email del usuario |
| `nombre` | `TEXT` | `NOT NULL` | Nombre completo |
| `rol` | `TEXT` | `NOT NULL DEFAULT 'mesero' CHECK (rol IN ('admin','mesero'))` | Rol en el sistema |
| `estado` | `TEXT` | `NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','activo','rechazado'))` | Estado de aprobación |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Fecha de registro |

**Índices**:
- `idx_usuarios_estado` ON `usuarios(estado)` — filtrar pendientes eficientemente

---

### 3. `public.productos`

Catálogo de productos ofrecidos en la discoteca.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `nombre` | `TEXT` | `NOT NULL` | Nombre del producto |
| `descripcion` | `TEXT` | | Descripción opcional |
| `categoria` | `TEXT` | `NOT NULL CHECK (categoria IN ('cerveza','michelada','soda','snack','otro'))` | Categoría |
| `tiene_variantes` | `BOOLEAN` | `NOT NULL DEFAULT false` | Si tiene variantes (ej: sabores de michelada) |
| `activo` | `BOOLEAN` | `NOT NULL DEFAULT true` | Borrado lógico |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

> **Regla**: Si `tiene_variantes = false`, el producto tiene UNA variante implícita (default) con el mismo nombre.

---

### 4. `public.variantes`

Especificaciones de cada producto (sabor, marca, presentación).  
Cada variante tiene su propio precio, costo y stock.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `producto_id` | `UUID` | `FK REFERENCES productos(id) ON DELETE CASCADE` | Producto padre |
| `nombre` | `TEXT` | `NOT NULL` | Nombre de la variante |
| `sku` | `TEXT` | `NOT NULL UNIQUE` | Código único de inventario |
| `precio` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | Precio de venta |
| `costo` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | Costo unitario |
| `stock` | `INT` | `NOT NULL DEFAULT 0` | Stock actual (CHECK ≥ 0 en aplicación) |
| `stock_minimo` | `INT` | `NOT NULL DEFAULT 5` | Umbral para alerta de reposición |
| `activa` | `BOOLEAN` | `NOT NULL DEFAULT true` | Borrado lógico |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Índices**:
- `idx_variantes_producto` ON `variantes(producto_id)` — JOIN con productos
- `UNIQUE(producto_id, nombre)` — no duplicados por producto

---

### 5. `public.mesas`

Mesas físicas de la discoteca.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `numero` | `INT` | `NOT NULL UNIQUE` | Número de mesa visible |
| `capacidad` | `INT` | `NOT NULL DEFAULT 4 CHECK (capacidad > 0)` | Cantidad de personas |
| `ubicacion` | `TEXT` | | Zona: VIP, Terraza, Interior, Barra |
| `activa` | `BOOLEAN` | `NOT NULL DEFAULT true` | Mesa habilitada |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

---

### 6. `public.sesiones`

Cuentas abiertas y cerradas en cada mesa.  
Una mesa SOLO puede tener UNA sesión abierta a la vez.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `mesa_id` | `UUID` | `FK REFERENCES mesas(id)` | Mesa asociada |
| `mesero_id` | `UUID` | `FK REFERENCES usuarios(id)` | Mesero que atiende |
| `estado` | `TEXT` | `NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada'))` | Estado de la sesión |
| `abierta_en` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Fecha/hora apertura |
| `cerrada_en` | `TIMESTAMPTZ` | | Fecha/hora cierre (nullable) |
| `metodo_pago` | `TEXT` | `CHECK (metodo_pago IN ('efectivo','tarjeta','transferencia'))` | Método de pago (nullable) |
| `total` | `DECIMAL(10,2)` | | Total calculado al cerrar (nullable cache) |

**Índices**:
- `idx_sesion_mesa_abierta` UNIQUE ON `sesiones(mesa_id)` WHERE `estado = 'abierta'` — enforce una sesión abierta por mesa
- `idx_sesion_mesero` ON `sesiones(mesero_id)` — filtrar por mesero

---

### 7. `public.items_sesion`

Consumos registrados en cada sesión. El precio se congela al momento de agregar el consumo.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `sesion_id` | `UUID` | `FK REFERENCES sesiones(id) ON DELETE CASCADE` | Sesión padre |
| `variante_id` | `UUID` | `FK REFERENCES variantes(id)` | Variante consumida |
| `cantidad` | `INT` | `NOT NULL CHECK (cantidad > 0)` | Cantidad |
| `precio_unitario` | `DECIMAL(10,2)` | `NOT NULL` | Precio al momento del consumo (snapshot) |
| `subtotal` | `DECIMAL(10,2)` | `NOT NULL` | `cantidad × precio_unitario` |
| `creado_en` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Índices**:
- `idx_items_sesion` ON `items_sesion(sesion_id)` — JOIN con sesiones

> **Nota**: `ON DELETE CASCADE` en `sesion_id` permite limpiar items si se elimina una sesión (no debería ocurrir en producción).

---

### 8. `public.compras`

Compras de reposición de inventario.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `proveedor` | `TEXT` | | Nombre del proveedor |
| `notas` | `TEXT` | | Notas u observaciones |
| `costo_total` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | Suma total de la compra |
| `creado_en` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

---

### 9. `public.items_compra`

Items individuales de cada compra.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `compra_id` | `UUID` | `FK REFERENCES compras(id) ON DELETE CASCADE` | Compra padre |
| `variante_id` | `UUID` | `FK REFERENCES variantes(id)` | Variante comprada |
| `cantidad` | `INT` | `NOT NULL CHECK (cantidad > 0)` | Cantidad comprada |
| `costo_unitario` | `DECIMAL(10,2)` | `NOT NULL` | Costo por unidad |
| `subtotal` | `DECIMAL(10,2)` | `NOT NULL` | `cantidad × costo_unitario` |

**Índices**:
- `idx_items_compra` ON `items_compra(compra_id)` — JOIN con compras

---

### 10. `public.movimientos_stock`

Auditoría de todos los cambios de stock. Positivo = entrada, negativo = salida.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `variante_id` | `UUID` | `FK REFERENCES variantes(id)` | Variante afectada |
| `cantidad` | `INT` | `NOT NULL CHECK (cantidad != 0)` | Cantidad (+entrada / -salida) |
| `tipo` | `TEXT` | `NOT NULL CHECK (tipo IN ('compra','venta','ajuste'))` | Origen del movimiento |
| `referencia_id` | `UUID` | | ID de compra o sesión relacionada |
| `creado_en` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Índices**:
- `idx_movimientos_variante` ON `movimientos_stock(variante_id)` — histórico por variante

---

## Triggers

### `on_auth_user_created`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol, estado)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    'mesero',
    'pendiente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Comportamiento**:
- Se ejecuta DESPUÉS de insertar en `auth.users` (misma transacción)
- Crea registro en `public.usuarios` con `rol = 'mesero'` y `estado = 'pendiente'`
- Usa `COALESCE` para fallback: si no hay `nombre` en metadatos, usa la parte local del email
- `SECURITY DEFINER` para poder insertar en `public` desde el contexto de `auth`

### `on_first_user_admin`

```sql
CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.usuarios;
  IF user_count = 1 THEN
    UPDATE public.usuarios SET rol = 'admin', estado = 'activo' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_first_user_admin
  AFTER INSERT ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.make_first_user_admin();
```

**Comportamiento**:
- Se ejecuta DESPUÉS de insertar en `public.usuarios`
- Si es el primer registro (`COUNT = 1`), lo promueve a `admin` con `estado = 'activo'`
- Los registros subsiguientes quedan como `mesero` con `estado = 'pendiente'`

> **Importante**: El trigger `on_first_user_admin` se ejecuta después de `on_auth_user_created` (que inserta en `public.usuarios`). No hay race condition porque ambos son triggers AFTER y están en la misma transacción.

---

## Seed Data

```sql
-- 8 mesas de prueba
INSERT INTO public.mesas (numero, capacidad, ubicacion) VALUES
  (1, 4, 'Interior'),
  (2, 4, 'Interior'),
  (3, 6, 'Interior'),
  (4, 2, 'VIP'),
  (5, 4, 'VIP'),
  (6, 8, 'Terraza'),
  (7, 4, 'Terraza'),
  (8, 4, 'Barra');
```

| Mesa # | Capacidad | Ubicación |
|--------|-----------|-----------|
| 1 | 4 | Interior |
| 2 | 4 | Interior |
| 3 | 6 | Interior |
| 4 | 2 | VIP |
| 5 | 4 | VIP |
| 6 | 8 | Terraza |
| 7 | 4 | Terraza |
| 8 | 4 | Barra |

> El primer usuario que se registre será admin automáticamente (trigger `on_first_user_admin`).

---

## Resumen de Constraints

| Tipo | Detalle |
|------|---------|
| `PK` | `id UUID DEFAULT gen_random_uuid()` en todas las tablas públicas |
| `FK` | `usuarios.id → auth.users.id`, más 7 FK entre tablas de negocio |
| `UNIQUE` | `usuarios.email`, `variantes.sku`, `variantes(producto_id, nombre)`, `mesas.numero` |
| `CHECK` | Roles, estados, categorías, cantidades positivas, stock no negativo, stock != 0 |
| **Partial UNIQUE** | `sesiones(mesa_id) WHERE estado = 'abierta'` |
