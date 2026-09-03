-- =========================================================
-- Turno Pelu — Qué servicios ofrece cada peluquero
-- Correr en: Supabase Dashboard > SQL Editor (después de 001, 002 y 003)
--
-- Tabla puente peluquero <-> servicio. Si un peluquero no tiene NINGUNA
-- fila acá, se lo trata como que ofrece TODOS los servicios (compatibilidad
-- hacia atrás, mismo criterio que horarios_laborales con "sin horario =
-- disponible siempre"). En cuanto se le asigna al menos un servicio, pasa a
-- ofrecer solo los que tiene asignados explícitamente.
-- =========================================================

create table if not exists peluquero_servicios (
  peluquero_id uuid not null references peluqueros (id) on delete cascade,
  servicio_id uuid not null references servicios (id) on delete cascade,
  primary key (peluquero_id, servicio_id)
);

create index if not exists idx_peluquero_servicios_servicio
  on peluquero_servicios (servicio_id);

alter table peluquero_servicios enable row level security;

-- Lectura pública: la necesita el flujo de reserva del cliente para saber
-- qué peluqueros ofrecer para cada servicio.
create policy "peluquero_servicios_lectura_publica"
  on peluquero_servicios for select
  using (true);

create policy "peluquero_servicios_admin_insert"
  on peluquero_servicios for insert
  to authenticated
  with check (true);

create policy "peluquero_servicios_admin_delete"
  on peluquero_servicios for delete
  to authenticated
  using (true);
