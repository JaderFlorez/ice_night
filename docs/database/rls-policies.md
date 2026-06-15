# Políticas Row Level Security (RLS) — ICE NIGHT ERP

Todas las tablas de negocio en `public` tienen RLS habilitado.  
El backend usa un pool con `service_role` que **bypassea RLS** — las políticas existen para acceso directo desde Supabase Dashboard / SQL Editor y para futura expansión.

---

## Helper Functions

### `public.is_admin()`

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin' AND estado = 'activo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Retorna `true` si el usuario autenticado es admin **y** está activo.

### `public.is_active()`

```sql
CREATE OR REPLACE FUNCTION public.is_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND estado = 'activo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Retorna `true` si el usuario autenticado tiene estado `activo` (sin importar el rol).

> Ambas funciones son `SECURITY DEFINER` para ejecutarse con permisos del owner de la función (postgres), no del usuario actual.

---

## Políticas por Tabla

### `public.usuarios`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `usuarios_self_read` | `SELECT` | `auth.uid() = id OR public.is_admin()` | Usuario lee su propio registro; admin lee todos |
| `usuarios_admin_update` | `UPDATE` | `public.is_admin()` | Solo admin puede actualizar |

**Efecto**: Un mesero solo ve su propio perfil. Admin ve y modifica todos.

---

### `public.productos`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `productos_read` | `SELECT` | `public.is_active()` | Todo usuario activo puede ver |
| `productos_admin_insert` | `INSERT` | `public.is_admin()` | Solo admin crea |
| `productos_admin_update` | `UPDATE` | `public.is_admin()` | Solo admin actualiza |
| `productos_admin_delete` | `DELETE` | `public.is_admin()` | Solo admin elimina |

---

### `public.variantes`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `variantes_read` | `SELECT` | `public.is_active()` | Todo usuario activo puede ver |
| `variantes_admin_insert` | `INSERT` | `public.is_admin()` | Solo admin crea |
| `variantes_admin_update` | `UPDATE` | `public.is_admin()` | Solo admin actualiza |
| `variantes_admin_delete` | `DELETE` | `public.is_admin()` | Solo admin elimina |

---

### `public.mesas`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `mesas_read` | `SELECT` | `public.is_active()` | Todo usuario activo puede ver |
| `mesas_active_insert` | `INSERT` | `public.is_active()` | Todo usuario activo puede crear |
| `mesas_active_update` | `UPDATE` | `public.is_active()` | Todo usuario activo puede actualizar |
| `mesas_active_delete` | `DELETE` | `public.is_active()` | Todo usuario activo puede eliminar |

**Diferencia con productos**: Las mesas son gestionadas por meseros también (no solo admin). Cualquier usuario activo puede CRUD.

---

### `public.sesiones`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `sesiones_read` | `SELECT` | `auth.uid() = mesero_id OR public.is_admin()` | Mesero lee sus propias sesiones; admin lee todas |
| `sesiones_insert` | `INSERT` | `auth.uid() = mesero_id AND public.is_active()` | Mesero crea sesiones asignadas a sí mismo |
| `sesiones_update` | `UPDATE` | `auth.uid() = mesero_id OR public.is_admin()` | Mesero actualiza sus propias sesiones; admin todas |

**Efecto**: Un mesero solo opera sobre sus propias sesiones. Admin tiene visión completa.

---

### `public.items_sesion`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `items_sesion_read` | `SELECT` | `EXISTS (SELECT 1 FROM sesiones WHERE id = items_sesion.sesion_id AND (mesero_id = auth.uid() OR public.is_admin()))` | Lee items de sesiones propias o todas si admin |
| `items_sesion_insert` | `INSERT` | `public.is_active() AND EXISTS (SELECT 1 FROM sesiones WHERE id = items_sesion.sesion_id AND mesero_id = auth.uid())` | Inserta solo en sesiones propias |
| `items_sesion_delete` | `DELETE` | `EXISTS (SELECT 1 FROM sesiones WHERE id = items_sesion.sesion_id AND mesero_id = auth.uid())` | Elimina solo de sesiones propias |

**Efecto**: Los meseros solo agregan/quitan items de sus propias sesiones. Admin no tiene restricción.

---

### `public.compras`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `compras_admin_all` | `ALL` | `public.is_admin()` | Solo admin |

---

### `public.items_compra`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `items_compra_admin_all` | `ALL` | `public.is_admin()` | Solo admin |

---

### `public.movimientos_stock`

| Política | Operación | Usando | Descripción |
|----------|-----------|--------|-------------|
| `movimientos_stock_admin_all` | `ALL` | `public.is_admin()` | Solo admin |

---

## Matriz de Políticas

| Tabla | `SELECT` | `INSERT` | `UPDATE` | `DELETE` | `ALL` |
|-------|:--------:|:--------:|:--------:|:--------:|:-----:|
| `usuarios` | 👤 self / 👑 admin | — | 👑 admin | — | — |
| `productos` | ✅ activo | 👑 admin | 👑 admin | 👑 admin | — |
| `variantes` | ✅ activo | 👑 admin | 👑 admin | 👑 admin | — |
| `mesas` | ✅ activo | ✅ activo | ✅ activo | ✅ activo | — |
| `sesiones` | 👤 own / 👑 admin | 👤 own + ✅ activo | 👤 own / 👑 admin | — | — |
| `items_sesion` | 👤 own / 👑 admin | 👤 own + ✅ activo | — | 👤 own | — |
| `compras` | — | — | — | — | 👑 admin |
| `items_compra` | — | — | — | — | 👑 admin |
| `movimientos_stock` | — | — | — | — | 👑 admin |

**Leyenda**:
- 👤 **own** — el usuario solo accede a registros donde es `mesero_id` (propios)
- 👑 **admin** — solo usuarios con `rol = 'admin'` y `estado = 'activo'`
- ✅ **activo** — cualquier usuario con `estado = 'activo'` (admin o mesero)

---

## Notas Técnicas

### ¿Por qué políticas separadas por operación?

Inicialmente se usaron políticas `ALL`, pero PostgreSQL no permite `ALL` con `WITH CHECK` para INSERT y `USING` para SELECT/UPDATE/DELETE en una sola política. Se separaron en políticas individuales por operación.

### Backend bypassea RLS

El pool de conexiones del backend usa `service_role` key de Supabase, que tiene permiso `BYPASSRLS` automáticamente. Esto significa que **todas las queries del backend pasan por alto RLS**.

Las políticas existen para:
1. **Seguridad en acceso directo** — si alguien accede desde Supabase Dashboard o SQL Editor con la `anon` key
2. **Futura migración** — si se decide mover queries al frontend (via `supabase-js` desde el browser)
3. **Documentación de intención** — definen qué acceso debería tener cada rol

### `is_admin()` requiere `estado = 'activo'`

La función `is_admin()` verifica tanto `rol = 'admin'` como `estado = 'activo'`. Un admin con estado `pendiente` o `rechazado` no pasa ninguna política.
