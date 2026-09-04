import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarTelefonoArgentino } from "@/lib/telefono";
import type { EstadoTurno } from "@/types/database";
import { indiceServiciosPorPeluquero, peluqueroOfreceServicio } from "./servicios-peluquero";
import { formatearHHMM, minutosDesdeMedianoche } from "./tiempo";

export interface DatosTurno {
  servicioId: string;
  peluqueroId: string;
  fecha: string;
  horaInicio: string;
  nombreCliente: string;
  telefonoCliente: string;
  estado: EstadoTurno;
  mercadoPagoId?: string | null;
}

export interface ResultadoCrearTurno {
  ok: boolean;
  error?: string;
  turno?: {
    id: string;
    peluqueroNombre: string;
    peluqueroWhatsapp: string;
    servicioNombre: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    nombreCliente: string;
  };
}

/**
 * Inserta un turno validando que el servicio y el peluquero existan y que
 * el peluquero ofrezca ese servicio. La usan tanto la reserva pública en
 * efectivo (server action, ver ./actions.ts) como el webhook de Mercado
 * Pago (route handler) cuando un pago se confirma — por eso vive en un
 * módulo aparte sin "use server": ese directive obliga a que todo export
 * de ese archivo sea una server action invocable desde el cliente, y este
 * helper es de uso interno entre server actions y route handlers.
 */
export async function crearTurnoEnBaseDeDatos(datos: DatosTurno): Promise<ResultadoCrearTurno> {
  const nombreCliente = datos.nombreCliente.trim();

  if (
    !datos.servicioId ||
    !datos.peluqueroId ||
    !datos.fecha ||
    !datos.horaInicio ||
    !nombreCliente ||
    !datos.telefonoCliente.trim()
  ) {
    return { ok: false, error: "Faltan datos para confirmar el turno." };
  }

  const telefonoCliente = normalizarTelefonoArgentino(datos.telefonoCliente);
  const supabase = createAdminClient();

  const { data: servicio, error: errorServicio } = await supabase
    .from("servicios")
    .select("nombre, duracion_minutos")
    .eq("id", datos.servicioId)
    .single();
  if (errorServicio || !servicio) {
    return { ok: false, error: "El servicio elegido ya no está disponible." };
  }

  const { data: peluquero, error: errorPeluquero } = await supabase
    .from("peluqueros")
    .select("nombre, telefono_whatsapp")
    .eq("id", datos.peluqueroId)
    .single();
  if (errorPeluquero || !peluquero) {
    return { ok: false, error: "El peluquero elegido ya no está disponible." };
  }

  const { data: asignacionesPeluquero } = await supabase
    .from("peluquero_servicios")
    .select("peluquero_id, servicio_id")
    .eq("peluquero_id", datos.peluqueroId);
  const indiceServicios = indiceServiciosPorPeluquero(asignacionesPeluquero ?? []);
  if (!peluqueroOfreceServicio(indiceServicios, datos.peluqueroId, datos.servicioId)) {
    return { ok: false, error: "Ese peluquero no ofrece el servicio elegido." };
  }

  const horaFin = formatearHHMM(minutosDesdeMedianoche(datos.horaInicio) + servicio.duracion_minutos);

  const { data: turnoCreado, error: errorInsert } = await supabase
    .from("turnos")
    .insert({
      peluquero_id: datos.peluqueroId,
      servicio_id: datos.servicioId,
      nombre_cliente: nombreCliente,
      telefono_cliente: telefonoCliente,
      fecha: datos.fecha,
      hora_inicio: datos.horaInicio,
      hora_fin: horaFin,
      estado: datos.estado,
      mercado_pago_id: datos.mercadoPagoId ?? null,
    })
    .select("id")
    .single();

  if (errorInsert || !turnoCreado) {
    // 23P01 = exclusion_violation: el constraint turnos_no_solapados
    // (supabase/001_schema.sql) frenó un choque de horarios porque otro
    // cliente reservó ese mismo horario un instante antes.
    if (errorInsert?.code === "23P01") {
      return { ok: false, error: "Ese horario se acaba de ocupar. Elegí otro, por favor." };
    }
    return { ok: false, error: "No se pudo confirmar el turno. Probá de nuevo." };
  }

  return {
    ok: true,
    turno: {
      id: turnoCreado.id,
      peluqueroNombre: peluquero.nombre,
      peluqueroWhatsapp: peluquero.telefono_whatsapp,
      servicioNombre: servicio.nombre,
      fecha: datos.fecha,
      horaInicio: datos.horaInicio,
      horaFin,
      nombreCliente,
    },
  };
}
