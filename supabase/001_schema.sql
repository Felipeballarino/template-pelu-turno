-- =========================================================
-- Turno Pelu — Esquema inicial de base de datos (Supabase/Postgres)
-- Correr en: Supabase Dashboard > SQL Editor
-- =========================================================

-- Necesaria para poder usar EXCLUDE con columnas "=" (btree) combinadas
-- con rangos (gist) en la misma constraint (anti-solapamiento de turnos).
create extension if not exists btree_gist;

-- ---------------------------------------------------------
-- Tabla: peluqueros
-- ---------------------------------------------------------
create table if not exists peluqueros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono_whatsapp text not null, -- formato E.164 sin "+": ej. 5491122334455
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

comment on column peluqueros.telefono_whatsapp is
  'Número en formato E.164 sin signo +, listo para usar en wa.me/<numero>';

-- ---------------------------------------------------------
-- Tabla: servicios
-- ---------------------------------------------------------
create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  duracion_minutos integer not null check (duracion_minutos > 0),
  precio numeric(10, 2) not null check (precio >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Tabla: turnos
-- ---------------------------------------------------------
create type estado_turno as enum ('pagado', 'pendiente_efectivo', 'cancelado');

create table if not exists turnos (
  id uuid primary key default gen_random_uuid(),
  peluquero_id uuid not null references peluqueros (id) on delete restrict,
  servicio_id uuid not null references servicios (id) on delete restrict,
  nombre_cliente text not null,
  telefono_cliente text not null,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  estado estado_turno not null default 'pendiente_efectivo',
  mercado_pago_id text, -- id de pago/preferencia de Mercado Pago, si aplica
  creado_en timestamptz not null default now(),

  constraint hora_fin_despues_de_inicio check (hora_fin > hora_inicio),

  -- Columna generada: rango de tiempo del turno dentro del día (fecha + horas),
  -- usada por la constraint de exclusión de abajo.
  rango_horario tsrange generated always as (
    tsrange(
      (fecha + hora_inicio)::timestamp,
      (fecha + hora_fin)::timestamp,
      '[)' -- incluye el inicio, excluye el fin: turnos "back to back" no se pisan
    )
  ) stored
);

-- ---------------------------------------------------------
-- Constraint anti-solapamiento (CRÍTICO):
-- Un mismo peluquero no puede tener dos turnos con rango_horario
-- superpuesto, salvo que alguno de los dos esté 'cancelado'.
-- Se resuelve a nivel de base de datos, no solo en frontend.
-- ---------------------------------------------------------
alter table turnos
  add constraint turnos_no_solapados
  exclude using gist (
    peluquero_id with =,
    rango_horario with &&
  )
  where (estado <> 'cancelado');

-- ---------------------------------------------------------
-- Índices de consulta frecuente
-- ---------------------------------------------------------
create index if not exists idx_turnos_fecha on turnos (fecha);
create index if not exists idx_turnos_peluquero_fecha on turnos (peluquero_id, fecha);
create index if not exists idx_turnos_estado on turnos (estado);

-- ---------------------------------------------------------
-- Row Level Security
-- El cliente final reserva sin login (usa la anon key), así que
-- habilitamos RLS y damos políticas explícitas y acotadas.
-- Ajustaremos esto con más detalle cuando integremos Supabase Auth
-- para el rol "peluquero" (paso 3).
-- ---------------------------------------------------------
alter table peluqueros enable row level security;
alter table servicios enable row level security;
alter table turnos enable row level security;

-- Lectura pública de peluqueros y servicios activos (para armar el flujo de reserva)
create policy "peluqueros_lectura_publica"
  on peluqueros for select
  using (activo = true);

create policy "servicios_lectura_publica"
  on servicios for select
  using (activo = true);

-- El cliente puede crear turnos (reservar), pero no leer ni modificar turnos ajenos
create policy "turnos_insert_publico"
  on turnos for insert
  with check (estado in ('pagado', 'pendiente_efectivo'));

-- Nota: las políticas de UPDATE/DELETE y la lectura de turnos por parte del
-- admin/peluquero se resolverán en el paso 3 (panel de administración),
-- una vez definido cómo autenticamos al admin y al peluquero.
