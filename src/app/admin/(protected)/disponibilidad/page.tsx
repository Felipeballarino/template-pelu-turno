import { createClient } from "@/lib/supabase/server";
import { formatearHora, hoyArgentina } from "@/lib/date";
import { eliminarBloqueo } from "./actions";
import { BloqueoForm } from "./bloqueo-form";
import { EliminarButton } from "./eliminar-button";
import { HorariosSection, type GrupoHorario } from "./horarios-section";
import type { HorarioLaboral } from "@/types/database";

/**
 * Agrupa filas de horarios_laborales por la combinación exacta de franjas
 * que comparten, para mostrar por ejemplo "Lunes a Viernes 08:00–12:00 y
 * 16:00–20:00" en una sola línea, en vez de una fila por cada franja de
 * cada día (aunque en la base sigue siendo una fila por día y franja).
 */
function agruparHorarios(horarios: HorarioLaboral[]): GrupoHorario[] {
  const porDia = new Map<number, HorarioLaboral[]>();
  for (const h of horarios) {
    const lista = porDia.get(h.dia_semana) ?? [];
    lista.push(h);
    porDia.set(h.dia_semana, lista);
  }
  for (const lista of porDia.values()) {
    lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }

  // Días que comparten exactamente la misma combinación de franjas van al
  // mismo grupo. La "firma" identifica esa combinación.
  const diasPorFirma = new Map<string, number[]>();
  for (const [dia, franjas] of porDia) {
    const firma = franjas.map((f) => `${f.hora_inicio}-${f.hora_fin}`).join(",");
    const dias = diasPorFirma.get(firma) ?? [];
    dias.push(dia);
    diasPorFirma.set(firma, dias);
  }

  const grupos: GrupoHorario[] = [];
  for (const dias of diasPorFirma.values()) {
    const franjasEjemplo = porDia.get(dias[0])!;
    const franjas = franjasEjemplo.map((f) => ({
      hora_inicio: f.hora_inicio,
      hora_fin: f.hora_fin,
      ids: dias.map((d) => porDia.get(d)!.find((x) => x.hora_inicio === f.hora_inicio)!.id),
    }));
    grupos.push({ dias: [...dias].sort((a, b) => a - b), franjas });
  }

  return grupos.sort((a, b) => a.dias[0] - b.dias[0]);
}

interface DisponibilidadPageProps {
  searchParams: Promise<{ peluquero_id?: string }>;
}

export default async function DisponibilidadPage({ searchParams }: DisponibilidadPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: peluqueros } = await supabase
    .from("peluqueros")
    .select("id, nombre")
    .order("nombre");

  const peluqueroId = params.peluquero_id || peluqueros?.[0]?.id || "";

  if (!peluqueroId) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-gray-900">Disponibilidad</h1>
        <p className="text-sm text-gray-500">
          Primero cargá un peluquero en la sección Peluqueros.
        </p>
      </div>
    );
  }

  const hoy = hoyArgentina();

  const [{ data: horarios, error: errorHorarios }, { data: bloqueos, error: errorBloqueos }] =
    await Promise.all([
      supabase
        .from("horarios_laborales")
        .select("*")
        .eq("peluquero_id", peluqueroId)
        .order("dia_semana", { ascending: true })
        .order("hora_inicio", { ascending: true }),
      supabase
        .from("bloqueos")
        .select("*")
        .eq("peluquero_id", peluqueroId)
        .gte("fecha", hoy)
        .order("fecha", { ascending: true })
        .order("hora_inicio", { ascending: true }),
    ]);

  const gruposHorarios = agruparHorarios(horarios ?? []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Disponibilidad</h1>
        <p className="text-sm text-gray-500">
          Horario habitual de trabajo y bloqueos puntuales de cada peluquero.
        </p>
      </div>

      <form className="flex items-end gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
          className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
        >
          Ver
        </button>
      </form>

      {/* ---------- Horario semanal habitual ---------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Horario semanal habitual</h2>
          <p className="text-sm text-gray-500">
            Si no cargás ningún horario acá, se considera disponible siempre. En cuanto agregás
            uno, solo se ofrecen turnos dentro de esos rangos.
          </p>
        </div>

        {errorHorarios && (
          <p className="text-sm text-red-600">Error al cargar horarios: {errorHorarios.message}</p>
        )}

        <HorariosSection peluqueroId={peluqueroId} grupos={gruposHorarios} />
      </section>

      {/* ---------- Bloqueos puntuales ---------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Bloqueos puntuales</h2>
          <p className="text-sm text-gray-500">
            Para marcar un momento específico como no disponible (ej. &quot;hoy de 16 a 17&quot;).
          </p>
        </div>

        <BloqueoForm peluqueroId={peluqueroId} />

        {errorBloqueos && (
          <p className="text-sm text-red-600">Error al cargar bloqueos: {errorBloqueos.message}</p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Fecha</th>
                <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Horario</th>
                <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Motivo</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {bloqueos?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                    Sin bloqueos próximos.
                  </td>
                </tr>
              )}
              {bloqueos?.map((b) => (
                <tr key={b.id} className="border-b">
                  <td className="px-4 py-2 text-sm text-gray-900">{b.fecha}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {formatearHora(b.hora_inicio)}–{formatearHora(b.hora_fin)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{b.motivo ?? "—"}</td>
                  <td className="px-4 py-2 text-right text-sm">
                    <EliminarButton
                      confirmMessage="¿Eliminar este bloqueo?"
                      onDelete={eliminarBloqueo.bind(null, b.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
