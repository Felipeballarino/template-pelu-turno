import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hoyArgentina, formatearFechaLarga } from "@/lib/date";
import { diasDeSemana, inicioSemana, sumarDias } from "@/lib/semana";
import { cancelarTurno } from "../turnos/actions";
import { CalendarGrid } from "./calendar-grid";

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Calendario</h1>
        <p className="text-sm text-gray-500">
          Turnos, bloqueos y horario habitual en una sola vista, por semana.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
        <form className="flex items-end gap-2">
          <input type="hidden" name="semana" value={semanaAncla} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Peluquero</label>
            <select
              name="peluquero_id"
              defaultValue={peluqueroId}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              {peluqueros?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Ver
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendario?${queryPeluquero}&semana=${semanaAnterior}`}
            className="rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Semana anterior
          </Link>
          <span className="text-sm text-gray-600">
            {formatearFechaLarga(lunes)} – {formatearFechaLarga(domingo)}
          </span>
          <Link
            href={`/admin/calendario?${queryPeluquero}&semana=${semanaSiguiente}`}
            className="rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Semana siguiente →
          </Link>
          <Link
            href={`/admin/calendario?${queryPeluquero}&semana=${hoyArgentina()}`}
            className="rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Hoy
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-green-400 bg-green-100" />
          Pagado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-amber-400 bg-amber-100" />
          Pendiente (efectivo)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-dashed border-gray-400 bg-gray-200" />
          Bloqueado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-gray-100" />
          Fuera de horario
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
