-- =========================================================
-- Turno Pelu — Foto opcional de peluqueros y servicios
-- Correr en: Supabase Dashboard > SQL Editor (después de 001 a 005)
-- =========================================================

-- ---------------------------------------------------------
-- Columnas nuevas (nullable: la foto es opcional)
-- ---------------------------------------------------------
alter table peluqueros add column if not exists foto_url text;
alter table servicios add column if not exists foto_url text;

-- ---------------------------------------------------------
-- Bucket de Storage público para servir las fotos directo por URL
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- Lectura pública (necesaria para mostrar la foto en el sitio de reserva
-- y en el panel sin firmar URLs).
create policy "fotos_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'fotos');

-- Solo el admin autenticado puede subir/reemplazar/borrar fotos.
create policy "fotos_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos');

create policy "fotos_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fotos')
  with check (bucket_id = 'fotos');

create policy "fotos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos');
