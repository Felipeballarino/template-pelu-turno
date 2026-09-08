import { createClient } from "@/lib/supabase/server";
import { PeluqueroRow } from "./peluquero-row";
import { NuevoPeluqueroForm } from "./nuevo-peluquero-form";

export default async function PeluquerosPage() {
  const supabase = await createClient();
  const [{ data: peluqueros, error }, { data: servicios }, { data: asignaciones }] =
    await Promise.all([
      supabase.from("peluqueros").select("*").order("creado_en", { ascending: true }),
      supabase.from("servicios").select("*").eq("activo", true).order("nombre"),
      supabase.from("peluquero_servicios").select("peluquero_id, servicio_id"),
    ]);

  if (error || !peluqueros) {
    return (
      <p className="text-sm text-red-600">
        Error al cargar peluqueros: {error?.message ?? "desconocido"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Peluqueros</h1>
        <p className="text-sm text-gray-500">Alta y servicios asignados a cada peluquero.</p>
      </div>

      <NuevoPeluqueroForm />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {peluqueros.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            Todavía no hay peluqueros cargados.
          </div>
        )}
        {peluqueros.map((p) => (
          <PeluqueroRow
            key={p.id}
            peluquero={p}
            servicios={servicios ?? []}
            serviciosAsignadosIds={
              (asignaciones ?? []).filter((a) => a.peluquero_id === p.id).map((a) => a.servicio_id)
            }
          />
        ))}
      </div>
    </div>
  );
}
