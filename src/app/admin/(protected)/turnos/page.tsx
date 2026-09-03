import { createClient } from "@/lib/supabase/server";
import { hoyArgentina, formatearFechaLarga } from "@/lib/date";
import { NuevoTurnoForm } from "./nuevo-turno-form";
import { TurnoRow } from "./turno-row";

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
      "id, fecha, hora_inicio, hora_fin, estado, nombre_cliente, telefono_cliente, peluqueros(nombre), servicios(nombre)"
    )
    .eq("fecha", fecha)
    .order("hora_inicio", { ascending: true });

  if (peluqueroId) {
    query = query.eq("peluquero_id", peluqueroId);
  }

  const { data: turnos, error } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Turnos</h1>
        <p className="text-sm text-gray-500 capitalize">{formatearFechaLarga(fecha)}</p>
      </div>

      <NuevoTurnoForm
        servicios={servicios ?? []}
        peluqueros={peluqueros ?? []}
        asignaciones={asignaciones ?? []}
        fechaInicial={fecha}
        peluqueroIdInicial={peluqueroId}
      />

      <form className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Fecha</label>
          <input
            type="date"
            name="fecha"
            defaultValue={fecha}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Peluquero</label>
          <select
            name="peluquero_id"
            defaultValue={peluqueroId}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
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
          Filtrar
        </button>
      </form>

      {error && <p className="text-sm text-red-600">Error al cargar turnos: {error.message}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Horario</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Peluquero</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Servicio</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {turnos?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">
                  No hay turnos para esta fecha.
                </td>
              </tr>
            )}
            {turnos?.map((t) => {
              // Supabase tipa los joins a-uno como array; acá sabemos que es 1 fila.
              const peluquero = Array.isArray(t.peluqueros) ? t.peluqueros[0] : t.peluqueros;
              const servicio = Array.isArray(t.servicios) ? t.servicios[0] : t.servicios;
              return (
                <TurnoRow
                  key={t.id}
                  id={t.id}
                  peluqueroNombre={peluquero?.nombre ?? "—"}
                  servicioNombre={servicio?.nombre ?? "—"}
                  nombreCliente={t.nombre_cliente}
                  telefonoCliente={t.telefono_cliente}
                  horaInicio={t.hora_inicio}
                  horaFin={t.hora_fin}
                  estado={t.estado}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
