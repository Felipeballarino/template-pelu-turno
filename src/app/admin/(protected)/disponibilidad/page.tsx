import { User, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatearHora, hoyArgentina } from "@/lib/date";
import { eliminarBloqueo } from "./actions";
import { BloqueoForm } from "./bloqueo-form";
import { EliminarButton } from "./eliminar-button";
import { HorariosSection } from "./horarios-section";

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Disponibilidad</h1>
        <p className="text-sm text-gray-500">
          Horario habitual de trabajo y bloqueos puntuales de cada peluquero.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
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
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          <Eye className="h-4 w-4" strokeWidth={1.8} />
          Ver
        </button>
      </form>

      {/* ---------- Horario semanal habitual ---------- */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Horario semanal habitual</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Si no cargás ningún horario acá, se considera disponible siempre. En cuanto agregás
            uno, solo se ofrecen turnos dentro de esos rangos.
          </p>
        </div>

        {errorHorarios && (
          <p className="text-sm text-red-600">Error al cargar horarios: {errorHorarios.message}</p>
        )}

        <HorariosSection peluqueroId={peluqueroId} horarios={horarios ?? []} />
      </section>

      {/* ---------- Bloqueos puntuales ---------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Bloqueos puntuales</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Para marcar un momento específico como no disponible (ej. &quot;hoy de 16 a 17&quot;).
          </p>
        </div>

        <BloqueoForm peluqueroId={peluqueroId} />

        {errorBloqueos && (
          <p className="text-sm text-red-600">Error al cargar bloqueos: {errorBloqueos.message}</p>
        )}

        <div className="space-y-2.5">
          {bloqueos?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              Sin bloqueos próximos.
            </div>
          )}
          {bloqueos?.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{b.fecha}</p>
                <p className="text-sm text-gray-500">
                  {formatearHora(b.hora_inicio)}–{formatearHora(b.hora_fin)}
                </p>
                {b.motivo && <p className="truncate text-xs text-gray-400">{b.motivo}</p>}
              </div>
              <EliminarButton
                confirmMessage="¿Eliminar este bloqueo?"
                onDelete={eliminarBloqueo.bind(null, b.id)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
