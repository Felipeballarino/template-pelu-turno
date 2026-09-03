"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyArgentina } from "@/lib/date";
import { obtenerProximosHorariosDisponibles } from "@/lib/reserva/actions";

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
