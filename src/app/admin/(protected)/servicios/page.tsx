import { createClient } from "@/lib/supabase/server";
import { ServicioRow } from "./servicio-row";
import { NuevoServicioForm } from "./nuevo-servicio-form";

export default async function ServiciosPage() {
  const supabase = await createClient();
  const { data: servicios, error } = await supabase
    .from("servicios")
    .select("*")
    .order("creado_en", { ascending: true });

  if (error) {
    return <p className="text-sm text-red-600">Error al cargar servicios: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Servicios</h1>
        <p className="text-sm text-gray-500">Nombre, duración y precio de cada servicio.</p>
      </div>

      <NuevoServicioForm />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {servicios.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            Todavía no hay servicios cargados.
          </div>
        )}
        {servicios.map((s) => (
          <ServicioRow key={s.id} servicio={s} />
        ))}
      </div>
    </div>
  );
}
