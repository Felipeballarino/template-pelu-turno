import Link from "next/link";
import { ChevronLeft, ChevronRight, User, Eye, ListChecks, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoyArgentina, formatearFechaCorta, formatearFechaLarga } from "@/lib/date";
import { diasDeSemana, sumarDias } from "@/lib/semana";
import { cancelarTurno } from "../turnos/actions";
import { CalendarGrid } from "./calendar-grid";
import { StatTile } from "../stat-tile";

interface CalendarioPageProps {
  searchParams: Promise<{ peluquero_id?: string; semana?: string }>;
}

export default async function CalendarioPage({ searchParams }: CalendarioPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: peluqueros } = await supabase
    .from("peluqueros")
    .select("id, nombre")
    .order("nombre");

  const peluqueroId = params.peluquero_id || peluqueros?.[0]?.id || "";
  const semanaAncla = params.semana || hoyArgentina();
  const dias = diasDeSemana(semanaAncla);
  const lunes = dias[0].fecha;
  const domingo = dias[6].fecha;
  const semanaAnterior = sumarDias(lunes, -7);
  const semanaSiguiente = sumarDias(lunes, 7);

  if (!peluqueroId) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-gray-900">Calendario</h1>
        <p className="text-sm text-gray-500">
          Primero cargá un peluquero en la sección Peluqueros.
        </p>
      </div>
    );
  }

  const [{ data: turnos, error: errorTurnos }, { data: bloqueos }, { data: horarios }] =
    await Promise.all([
      supabase
        .from("turnos")
        .select("id, fecha, hora_inicio, hora_fin, estado, nombre_cliente, servicios(nombre)")
        .eq("peluquero_id", peluqueroId)
        .gte("fecha", lunes)
        .lte("fecha", domingo),
      supabase
        .from("bloqueos")
        .select("id, fecha, hora_inicio, hora_fin, motivo")
        .eq("peluquero_id", peluqueroId)
        .gte("fecha", lunes)
        .lte("fecha", domingo),
      supabase.from("horarios_laborales").select("*").eq("peluquero_id", peluqueroId),
    ]);

  const turnosParaGrilla = (turnos ?? []).map((t) => {
    const servicio = Array.isArray(t.servicios) ? t.servicios[0] : t.servicios;
    return {
      id: t.id,
      fecha: t.fecha,
      hora_inicio: t.hora_inicio,
      hora_fin: t.hora_fin,
      estado: t.estado,
      nombre_cliente: t.nombre_cliente,
      servicioNombre: servicio?.nombre ?? "—",
    };
  });

  const queryPeluquero = `peluquero_id=${peluqueroId}`;

  const totalSemana = turnosParaGrilla.length;
  const pagadosSemana = turnosParaGrilla.filter((t) => t.estado === "pagado").length;
  const pendientesSemana = turnosParaGrilla.filter((t) => t.estado === "pendiente_efectivo").length;
  const canceladosSemana = turnosParaGrilla.filter((t) => t.estado === "cancelado").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Calendario</h1>
        <p className="hidden text-sm text-gray-500 sm:block">
          Turnos, bloqueos y horario habitual en una sola vista, por semana.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile icono={ListChecks} valor={totalSemana} etiqueta="Turnos en la semana" color="violeta" />
        <StatTile icono={CheckCircle2} valor={pagadosSemana} etiqueta="Pagados" color="verde" />
        <StatTile icono={Clock3} valor={pendientesSemana} etiqueta="Pendientes" color="ambar" />
        <StatTile icono={XCircle} valor={canceladosSemana} etiqueta="Cancelados" color="gris" />
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <form className="flex items-center gap-3">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
            <User className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
            <select
              name="peluquero_id"
              defaultValue={peluqueroId}
              className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none"
            >
              {peluqueros?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="semana" value={semanaAncla} />
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
          >
            <Eye className="h-4 w-4" strokeWidth={1.8} />
            Ver
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendario?${queryPeluquero}&semana=${semanaAnterior}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <span className="flex-1 truncate text-center text-sm font-semibold text-gray-800">
            <span className="sm:hidden">
              {formatearFechaCorta(lunes)} – {formatearFechaCorta(domingo)}
            </span>
            <span className="hidden sm:inline">
              {formatearFechaLarga(lunes)} – {formatearFechaLarga(domingo)}
            </span>
          </span>
          <Link
            href={`/admin/calendario?${queryPeluquero}&semana=${semanaSiguiente}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <Link
            href={`/admin/calendario?${queryPeluquero}&semana=${hoyArgentina()}`}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            Hoy
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 sm:text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-green-400 bg-green-100" />
          Pagado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-amber-400 bg-amber-100" />
          Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-dashed border-gray-400 bg-gray-200" />
          Bloqueado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-gray-100" />
          Fuera de horario
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-3 rounded-full bg-red-500" />
          Ahora
        </span>
      </div>

      {errorTurnos && (
        <p className="text-sm text-red-600">Error al cargar turnos: {errorTurnos.message}</p>
      )}

      <CalendarGrid
        dias={dias}
        turnos={turnosParaGrilla}
        bloqueos={bloqueos ?? []}
        horarios={horarios ?? []}
        onCancelarTurno={cancelarTurno}
      />
    </div>
  );
}
