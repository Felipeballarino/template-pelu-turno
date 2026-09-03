-- =========================================================
-- Turno Pelu — Políticas de RLS para el panel de administración
-- Correr en: Supabase Dashboard > SQL Editor (después de schema.sql)
-- =========================================================
--
-- Por ahora tratamos a todo usuario autenticado (via Supabase Auth) como
-- admin: el único login que existe es el del dueño de la peluquería. Si en
-- el futuro se suma el rol "peluquero" (nivel 2), estas políticas se van
-- a acotar agregando una tabla de roles.
--
-- Recomendación: en Supabase Dashboard > Authentication > Providers,
-- desactivar "Allow new users to sign up" y crear el usuario admin a mano
-- desde Authentication > Users, para que nadie más pueda registrarse.

-- ---------------------------------------------------------
-- peluqueros: el admin ve todos (activos e inactivos) y puede
-- crear/editar/borrar
-- ---------------------------------------------------------
create policy "peluqueros_admin_select"
  on peluqueros for select
  to authenticated
  using (true);

create policy "peluqueros_admin_insert"
  on peluqueros for insert
  to authenticated
  with check (true);

create policy "peluqueros_admin_update"
  on peluqueros for update
  to authenticated
  using (true)
  with check (true);

create policy "peluqueros_admin_delete"
  on peluqueros for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------
-- servicios: idéntico criterio
-- ---------------------------------------------------------
create policy "servicios_admin_select"
  on servicios for select
  to authenticated
  using (true);

create policy "servicios_admin_insert"
  on servicios for insert
  to authenticated
  with check (true);

create policy "servicios_admin_update"
  on servicios for update
  to authenticated
  using (true)
  with check (true);

create policy "servicios_admin_delete"
  on servicios for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------
-- turnos: el admin ve todos los turnos y puede editarlos
-- (ej. cancelar un turno pendiente_efectivo, corregir datos).
-- No se agrega policy de delete: cancelar (estado='cancelado')
-- es la forma correcta de "borrar" un turno para no perder el
-- historial ni liberar el hueco de forma inconsistente.
-- ---------------------------------------------------------
create policy "turnos_admin_select"
  on turnos for select
  to authenticated
  using (true);

create policy "turnos_admin_update"
  on turnos for update
  to authenticated
  using (true)
  with check (true);
