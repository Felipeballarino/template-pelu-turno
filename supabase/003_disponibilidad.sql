-- =========================================================
-- Turno Pelu — Disponibilidad de peluqueros
-- Correr en: Supabase Dashboard > SQL Editor (después de 001 y 002)
--
-- Dos mecanismos, gestionados por el admin desde el panel:
--  - horarios_laborales: horario semanal habitual de cada peluquero
--    (ej. "trabaja lunes a viernes de 13 a 20"). Si un peluquero no
--    tiene ninguna fila acá, se lo considera disponible sin
--    restricción semanal (comportamiento actual, sin romper nada).
--  - bloqueos: excepciones puntuales para un día y horario concreto
--    (ej. "hoy de 16 a 17 ocupado", con motivo opcional).
--
-- El cálculo real de horarios libres (horario_laboral menos bloqueos
-- menos turnos ya tomados) se hace en el flujo de reserva del cliente
-- (paso 4), no acá.
-- =========================================================

create table if not exists horarios_laborales (
  id uuid primary key default gen_random_uuid(),
  peluquero_id uuid not null references peluqueros (id) on delete cascade,
  -- 0 = domingo ... 6 = sábado (misma convención que Date.getDay() en JS)
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  creado_en timestamptz not null default now(),

  constraint horario_fin_despues_de_inicio check (hora_fin > hora_inicio)
);

create index if not exists idx_horarios_laborales_peluquero
  on horarios_laborales (peluquero_id, dia_semana);

create table if not exists bloqueos (
  id uuid primary key default gen_random_uuid(),
  peluquero_id uuid not null references peluqueros (id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  motivo text,
  creado_en timestamptz not null default now(),

  constraint bloqueo_fin_despues_de_inicio check (hora_fin > hora_inicio)
);

create index if not exists idx_bloqueos_peluquero_fecha
  on bloqueos (peluquero_id, fecha);

-- ---------------------------------------------------------
-- RLS: lectura pública (se necesita para calcular horarios
-- disponibles en la pantalla de reserva del cliente), y
-- administración completa solo para el admin autenticado.
-- ---------------------------------------------------------
alter table horarios_laborales enable row level security;
alter table bloqueos enable row level security;

create policy "horarios_laborales_lectura_publica"
  on horarios_laborales for select
  using (true);

create policy "horarios_laborales_admin_insert"
  on horarios_laborales for insert
  to authenticated
  with check (true);

create policy "horarios_laborales_admin_update"
  on horarios_laborales for update
  to authenticated
  using (true)
  with check (true);

create policy "horarios_laborales_admin_delete"
  on horarios_laborales for delete
  to authenticated
  using (true);

create policy "bloqueos_lectura_publica"
  on bloqueos for select
  using (true);

create policy "bloqueos_admin_insert"
  on bloqueos for insert
  to authenticated
  with check (true);

create policy "bloqueos_admin_update"
  on bloqueos for update
  to authenticated
  using (true)
  with check (true);

create policy "bloqueos_admin_delete"
  on bloqueos for delete
  to authenticated
  using (true);
