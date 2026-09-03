"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Los <input type="time"> mandan "HH:MM", pero Postgres devuelve las horas
// ya guardadas como "HH:MM:SS". Se normalizan a "HH:MM:SS" antes de
// comparar strings, para que una comparación de horarios "tocándose" en el
// límite (ej. termina 12:00 / empieza 12:00) no dé un falso solapamiento
// por comparar strings de distinto largo.
function normalizarHora(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

export async function crearHorarioLaboral(formData: FormData) {
  const peluquero_id = String(formData.get("peluquero_id") ?? "");
  const dias_semana = formData.getAll("dias_semana").map(Number);
  const hora_inicio = normalizarHora(String(formData.get("hora_inicio") ?? ""));
  const hora_fin = normalizarHora(String(formData.get("hora_fin") ?? ""));

  if (!peluquero_id || dias_semana.length === 0 || !hora_inicio || !hora_fin) {
    throw new Error("Completá peluquero, al menos un día y el horario.");
  }
  if (hora_fin <= hora_inicio) {
    throw new Error("El horario de fin tiene que ser posterior al de inicio.");
  }

  const supabase = await createClient();

  // Si para alguno de estos días ya existe una franja que se superpone con
  // la nueva, se la reemplaza (se borra la vieja y se inserta la nueva) en
  // vez de dejar duplicados. Así, volver a cargar "lunes a viernes 8 a 12"
  // con un horario corregido pisa el anterior en lugar de acumularse.
  const { data: existentes, error: errorExistentes } = await supabase
    .from("horarios_laborales")
    .select("id, hora_inicio, hora_fin")
    .eq("peluquero_id", peluquero_id)
    .in("dia_semana", dias_semana);
  if (errorExistentes) throw new Error(errorExistentes.message);

  const idsSuperpuestos = (existentes ?? [])
    .filter((h) => h.hora_inicio < hora_fin && h.hora_fin > hora_inicio)
    .map((h) => h.id);

  if (idsSuperpuestos.length > 0) {
    const { error: errorBorrado } = await supabase
      .from("horarios_laborales")
      .delete()
      .in("id", idsSuperpuestos);
    if (errorBorrado) throw new Error(errorBorrado.message);
  }

  // Un día puede tener varias franjas (ej. mañana y tarde), así que se
  // permite elegir varios días a la vez para cargar rápido una franja
  // que se repite (ej. "lunes a viernes de 9 a 12").
  const { error } = await supabase
    .from("horarios_laborales")
    .insert(dias_semana.map((dia_semana) => ({ peluquero_id, dia_semana, hora_inicio, hora_fin })));
  if (error) throw new Error(error.message);

  revalidatePath("/admin/disponibilidad");
}

export async function eliminarHorarioLaboral(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("horarios_laborales").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/disponibilidad");
}

/** Borra varias filas de una sola vez (ej. un grupo "Lunes a Viernes"). */
export async function eliminarHorariosLaborales(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("horarios_laborales").delete().in("id", ids);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/disponibilidad");
}

export interface ConflictoTurno {
  telefonoCliente: string;
  nombreCliente: string;
  servicioNombre: string;
}

/**
 * Turnos activos de un peluquero que se superponen con el horario que se
 * está por bloquear. Se usa para avisarle al admin ANTES de guardar el
 * bloqueo (ver bloqueo-form.tsx), ya que bloquear un horario no cancela
 * automáticamente el turno que ya estaba reservado ahí.
 */
export async function verificarConflictosBloqueo(
  peluquero_id: string,
  fecha: string,
  horaInicioInput: string,
  horaFinInput: string
): Promise<ConflictoTurno[]> {
  const hora_inicio = normalizarHora(horaInicioInput);
  const hora_fin = normalizarHora(horaFinInput);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select("nombre_cliente, telefono_cliente, hora_inicio, hora_fin, servicios(nombre)")
    .eq("peluquero_id", peluquero_id)
    .eq("fecha", fecha)
    .neq("estado", "cancelado");
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((t) => t.hora_inicio < hora_fin && t.hora_fin > hora_inicio)
    .map((t) => {
      const servicio = Array.isArray(t.servicios) ? t.servicios[0] : t.servicios;
      return {
        telefonoCliente: t.telefono_cliente,
        nombreCliente: t.nombre_cliente,
        servicioNombre: servicio?.nombre ?? "su turno",
      };
    });
}

export async function crearBloqueo(formData: FormData) {
  const peluquero_id = String(formData.get("peluquero_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora_inicio = String(formData.get("hora_inicio") ?? "");
  const hora_fin = String(formData.get("hora_fin") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!peluquero_id || !fecha || !hora_inicio || !hora_fin) {
    throw new Error("Completá peluquero, fecha y horario.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bloqueos")
    .insert({ peluquero_id, fecha, hora_inicio, hora_fin, motivo });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/disponibilidad");
}

export async function eliminarBloqueo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bloqueos").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/disponibilidad");
}
