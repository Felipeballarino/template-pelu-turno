-- =========================================================
-- Turno Pelu — Recordatorio de turno
-- Correr en: Supabase Dashboard > SQL Editor (después de 001 a 004)
--
-- No hay envío automático de WhatsApp (requeriría la API paga/con trámite
-- de WhatsApp Business). En su lugar, el admin ve un botón "Recordar" en
-- los turnos de hoy que empiezan en menos de 5hs, que abre WhatsApp con el
-- mensaje ya armado. Esta columna evita mandarlo dos veces sin querer.
-- =========================================================

alter table turnos
  add column if not exists recordatorio_enviado boolean not null default false;
