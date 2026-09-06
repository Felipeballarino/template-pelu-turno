import { CalendarDays, User, Filter, ListChecks, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoyArgentina, horaActualArgentinaEnMinutos, formatearFechaLarga } from "@/lib/date";
import { NuevoTurnoForm } from "./nuevo-turno-form";
import { TurnoCard } from "./turno-card";
import { StatTile } from "../stat-tile";

interface TurnosPageProps {
  searchParams: Promise<{ fecha?: string; peluquero_id?: string }>;
}

export default async function TurnosPage({ searchParams }: TurnosPageProps) {
  const params = await searchParams;
  const fecha = params.fecha || hoyArgentina();
  const peluqueroId = params.peluquero_id || "";

  const supabase = await createClient();

  const [{ data: peluqueros }, { data: servicios }, { data: asignaciones }] = await Promise.all([
    supabase.from("peluqueros").select("*").eq("activo", true).order("nombre"),
    supabase.from("servicios").select("*").eq("activo", true).order("nombre"),
    supabase.from("peluquero_servicios").select("peluquero_id, servicio_id"),
  ]);

  let query = supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, hora_fin, estado, nombre_cliente, telefono_cliente, recordatorio_enviado, peluquero_id, servicio_id, peluqueros(nombre), servicios(nombre)"
    )
    .eq("fecha", fecha)
    .order("hora_inicio", { ascending: true });

  if (peluqueroId) {
    query = query.eq("peluquero_id", peluqueroId);
  }

  const { data: turnos, error } = await query;

  // Ventana del botón "Recordar": cualquier turno de hoy que todavía no
  // empezó, no esté cancelado y sin recordatorio ya enviado.
  const esHoy = fecha === hoyArgentina();
  const minutosAhora = horaActualArgentinaEnMinutos();

  const filas = (turnos ?? []).map((t) => {
    // Supabase tipa los joins a-uno como array; acá sabemos que es 1 fila.
    const peluquero = Array.isArray(t.peluqueros) ? t.peluqueros[0] : t.peluqueros;
    const servicio = Array.isArray(t.servicios) ? t.servicios[0] : t.servicios;
    const [h, m] = t.hora_inicio.split(":").map(Number);
    const minutosInicio = h * 60 + m;
    const [hFin, mFin] = t.hora_fin.split(":").map(Number);
    const minutosFin = hFin * 60 + mFin;
    const puedeRecordar =
      esHoy &&
      t.estado !== "cancelado" &&
      !t.recordatorio_enviado &&
      minutosInicio >= minutosAhora;
    const enCurso =
      esHoy &&
      t.estado !== "cancelado" &&
      minutosAhora >= minutosInicio &&
      minutosAhora < minutosFin;
    return {
      id: t.id,
      peluqueroId: t.peluquero_id,
      servicioId: t.servicio_id,
      peluqueroNombre: peluquero?.nombre ?? "—",
      servicioNombre: servicio?.nombre ?? "—",
      nombreCliente: t.nombre_cliente,
      telefonoCliente: t.telefono_cliente,
      fecha: t.fecha,
      horaInicio: t.hora_inicio,
      horaFin: t.hora_fin,
      estado: t.estado,
      puedeRecordar,
      enCurso,
    };
  });

  const totalDia = filas.length;
  const pagadosDia = filas.filter((f) => f.estado === "pagado").length;
  const pendientesDia = filas.filter((f) => f.estado === "pendiente_efectivo").length;
  const canceladosDia = filas.filter((f) => f.estado === "cancelado").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Turnos</h1>
        <p className="text-sm text-gray-500 capitalize">{formatearFechaLarga(fecha)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile icono={ListChecks} valor={totalDia} etiqueta="Turnos del día" color="violeta" />
        <StatTile icono={CheckCircle2} valor={pagadosDia} etiqueta="Pagados" color="verde" />
        <StatTile icono={Clock3} valor={pendientesDia} etiqueta="Pendientes" color="ambar" />
        <StatTile icono={XCircle} valor={canceladosDia} etiqueta="Cancelados" color="gris" />
      </div>

      <NuevoTurnoForm
        servicios={servicios ?? []}
        peluqueros={peluqueros ?? []}
        asignaciones={asignaciones ?? []}
        fechaInicial={fecha}
        peluqueroIdInicial={peluqueroId}
      />

      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
          <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
          <input
            type="date"
            name="fecha"
            defaultValue={fecha}
            className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
          <User className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
          <select
            name="peluquero_id"
            defaultValue={peluqueroId}
            className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none"
          >
            <option value="">Todos los peluqueros</option>
            {peluqueros?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          <Filter className="h-4 w-4" strokeWidth={1.8} />
          Filtrar
        </button>
      </form>

      {error && <p className="text-sm text-red-600">Error al cargar turnos: {error.message}</p>}

      <div className="space-y-2.5">
        {filas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            No hay turnos para esta fecha.
          </div>
        )}
        {filas.map((f) => (
          <TurnoCard
            key={f.id}
            {...f}
            peluqueros={peluqueros ?? []}
            servicios={servicios ?? []}
            asignaciones={asignaciones ?? []}
          />
        ))}
      </div>
    </div>
  );
}
