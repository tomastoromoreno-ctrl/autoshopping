-- AutoShopping - Corrección de Seguridad de Fila (RLS)
-- Deshabilita RLS en las tablas que no tienen políticas configuradas o que causan conflictos de escritura desde la API.
-- Dado que la API de NestJS es la única que interactúa con la base de datos (con lógica propia de aislamiento), RLS es redundante aquí.

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
