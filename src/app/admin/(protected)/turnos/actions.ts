"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyArgentina } from "@/lib/date";
import { obtenerProximosHorariosDisponibles } from "@/lib/reserva/actions";
import { formatearHHMM, minutosDesdeMedianoche } from "@/lib/reserva/tiempo";

export interface CancelacionInfo {
  nombreCliente: string;
  telefonoCliente: string;
  servicioNombre: string;
  fecha: string;
  horaInicio: string;
  alternativas: { fecha: string; hora: string }[];
}

export async function cancelarTurno(id: string): Promise<CancelacionInfo | null> {
  const supabase = await createClient();

  const { data: turno, error: errorTurno } = await supabase
    .from("turnos")
    .select(
      "nombre_cliente, telefono_cliente, fecha, hora_inicio, peluquero_id, servicio_id, servicios(nombre, duracion_minutos)"
    )
    .eq("id", id)
    .single();
  if (errorTurno || !turno) throw new Error(errorTurno?.message ?? "No se encontró el turno.");

  const { error } = await supabase.from("turnos").update({ estado: "cancelado" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/turnos");
  revalidatePath("/admin/calendario");

  const servicio = Array.isArray(turno.servicios) ? turno.servicios[0] : turno.servicios;

  // Se buscan horarios libres a partir de hoy (no de la fecha del turno
  // cancelado, que puede ya haber pasado) para poder ofrecérselos al
  // cliente junto con el aviso de cancelación.
  const alternativas = servicio
    ? await obtenerProximosHorariosDisponibles({
        peluqueroId: turno.peluquero_id,
        servicioId: turno.servicio_id,
        duracionMinutos: servicio.duracion_minutos,
        desdeFecha: turno.fecha > hoyArgentina() ? turno.fecha : hoyArgentina(),
      })
    : [];

  return {
    nombreCliente: turno.nombre_cliente,
    telefonoCliente: turno.telefono_cliente,
    servicioNombre: servicio?.nombre ?? "el turno",
    fecha: turno.fecha,
    horaInicio: turno.hora_inicio,
    alternativas: alternativas.map((a) => ({ fecha: a.fecha, hora: a.hora })),
  };
}

export interface EdicionTurnoInfo {
  nombreCliente: string;
  telefonoCliente: string;
  servicioNombre: string;
  fecha: string;
  horaInicio: string;
}

export interface ResultadoEdicionTurno {
  ok: boolean;
  error?: string;
  info?: EdicionTurnoInfo;
}

/**
 * Reprograma un turno existente (día, horario, peluquero y/o servicio) desde
 * el panel. Igual que crearTurnoEnBaseDeDatos, se apoya en el constraint
 * turnos_no_solapados de la base para frenar choques de horario.
 */
export async function actualizarTurno(
  id: string,
  datos: { peluqueroId: string; servicioId: string; fecha: string; horaInicio: string }
): Promise<ResultadoEdicionTurno> {
  const supabase = await createClient();

  const { data: servicio, error: errorServicio } = await supabase
    .from("servicios")
    .select("nombre, duracion_minutos")
    .eq("id", datos.servicioId)
    .single();
  if (errorServicio || !servicio) {
    return { ok: false, error: "El servicio elegido ya no está disponible." };
  }

  const horaFin = formatearHHMM(minutosDesdeMedianoche(datos.horaInicio) + servicio.duracion_minutos);

  const { data: turnoActualizado, error } = await supabase
    .from("turnos")
    .update({
      peluquero_id: datos.peluqueroId,
      servicio_id: datos.servicioId,
      fecha: datos.fecha,
      hora_inicio: datos.horaInicio,
      hora_fin: horaFin,
    })
    .eq("id", id)
    .select("nombre_cliente, telefono_cliente")
    .single();

  if (error || !turnoActualizado) {
    // 23P01 = exclusion_violation (ver crearTurnoEnBaseDeDatos / schema.sql).
    if (error?.code === "23P01") {
      return { ok: false, error: "Ese horario ya está ocupado. Elegí otro." };
    }
    return { ok: false, error: error?.message ?? "No se pudo guardar el turno." };
  }

  revalidatePath("/admin/turnos");
  revalidatePath("/admin/calendario");

  return {
    ok: true,
    info: {
      nombreCliente: turnoActualizado.nombre_cliente,
      telefonoCliente: turnoActualizado.telefono_cliente,
      servicioNombre: servicio.nombre,
      fecha: datos.fecha,
      horaInicio: datos.horaInicio,
    },
  };
}

/** Marca que ya se le mandó el recordatorio de hoy, para no duplicarlo. */
export async function marcarRecordatorioEnviado(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("turnos")
    .update({ recordatorio_enviado: true })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/turnos");
}
