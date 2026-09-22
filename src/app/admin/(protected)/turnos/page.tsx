import Link from "next/link";
import { CalendarDays, User, Filter, ListChecks, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoyArgentina, horaActualArgentinaEnMinutos, formatearFechaLarga } from "@/lib/date";
import { NuevoTurnoForm } from "./nuevo-turno-form";
import { TurnoCard } from "./turno-card";
import { StatTile } from "../stat-tile";
import { marcarTurnosPasadosComoPagados } from "@/lib/turnos/completar-pagos";
import { AutoRefresh } from "../auto-refresh";

interface TurnosPageProps {
  searchParams: Promise<{ fecha?: string; peluquero_id?: string; vista?: string }>;
}

export default async function TurnosPage({ searchParams }: TurnosPageProps) {
  const params = await searchParams;
  const fecha = params.fecha || hoyArgentina();
  const peluqueroId = params.peluquero_id || "";
  // Vista "historial": todos los turnos de un peluquero, sin filtrar por fecha.
  const esHistorial = params.vista === "historial" && !!peluqueroId;

  const supabase = await createClient();
  await marcarTurnosPasadosComoPagados(supabase);

  const [{ data: peluqueros }, { data: servicios }, { data: asignaciones }] = await Promise.all([
    supabase.from("peluqueros").select("*").eq("activo", true).order("nombre"),
    supabase.from("servicios").select("*").eq("activo", true).order("nombre"),
    supabase.from("peluquero_servicios").select("peluquero_id, servicio_id"),
  ]);

  let query = supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, hora_fin, estado, nombre_cliente, telefono_cliente, recordatorio_enviado, peluquero_id, servicio_id, peluqueros(nombre), servicios(nombre)"
    );

  if (esHistorial) {
    query = query
      .eq("peluquero_id", peluqueroId)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false })
      .limit(300);
  } else {
    query = query.eq("fecha", fecha).order("hora_inicio", { ascending: true });
    if (peluqueroId) {
      query = query.eq("peluquero_id", peluqueroId);
    }
  }

  const { data: turnos, error } = await query;

  // Ventana del botón "Recordar": cualquier turno de hoy que todavía no
  // empezó, no esté cancelado y sin recordatorio ya enviado.
  const esHoy = !esHistorial && fecha === hoyArgentina();
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

  const total = filas.length;
  const pagados = filas.filter((f) => f.estado === "pagado").length;
  const pendientes = filas.filter((f) => f.estado === "pendiente_efectivo").length;
  const cancelados = filas.filter((f) => f.estado === "cancelado").length;
  const nombrePeluqueroHistorial =
    peluqueros?.find((p) => p.id === peluqueroId)?.nombre ?? filas[0]?.peluqueroNombre ?? "";

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          {esHistorial ? `Historial de ${nombrePeluqueroHistorial}` : "Turnos"}
        </h1>
        <p className="text-sm text-gray-500 capitalize">
          {esHistorial ? "Todos los turnos, de más reciente a más antiguo." : formatearFechaLarga(fecha)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile icono={ListChecks} valor={total} etiqueta={esHistorial ? "Turnos" : "Turnos del día"} color="violeta" />
        <StatTile icono={CheckCircle2} valor={pagados} etiqueta="Pagados" color="verde" />
        <StatTile icono={Clock3} valor={pendientes} etiqueta="Pendientes" color="ambar" />
        <StatTile icono={XCircle} valor={cancelados} etiqueta="Cancelados" color="gris" />
      </div>

      {!esHistorial && (
        <NuevoTurnoForm
          servicios={servicios ?? []}
          peluqueros={peluqueros ?? []}
          asignaciones={asignaciones ?? []}
          fechaInicial={fecha}
          peluqueroIdInicial={peluqueroId}
        />
      )}

      {esHistorial ? (
        <Link
          href={`/admin/turnos?fecha=${hoyArgentina()}&peluquero_id=${peluqueroId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          ← Volver a la vista por día
        </Link>
      ) : (
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
          {peluqueroId && (
            <Link
              href={`/admin/turnos?peluquero_id=${peluqueroId}&vista=historial`}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Ver historial completo →
            </Link>
          )}
        </form>
      )}

      {error && <p className="text-sm text-red-600">Error al cargar turnos: {error.message}</p>}

      <div className="space-y-2.5">
        {filas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            {esHistorial ? "Este peluquero todavía no tiene turnos." : "No hay turnos para esta fecha."}
          </div>
        )}
        {filas.map((f) => (
          <TurnoCard
            key={f.id}
            {...f}
            mostrarFecha={esHistorial}
            peluqueros={peluqueros ?? []}
            servicios={servicios ?? []}
            asignaciones={asignaciones ?? []}
          />
        ))}
      </div>
    </div>
  );
}
