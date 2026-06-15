-- Create 8 test tables
INSERT INTO public.mesas (numero, capacidad, ubicacion) VALUES
  (1, 4, 'Interior'),
  (2, 4, 'Interior'),
  (3, 6, 'Interior'),
  (4, 2, 'VIP'),
  (5, 4, 'VIP'),
  (6, 8, 'Terraza'),
  (7, 4, 'Terraza'),
  (8, 4, 'Barra');

-- Create default categories via productos
-- Note: The first registered user becomes admin automatically
-- (handled by trigger in 00001_usuarios.sql)
