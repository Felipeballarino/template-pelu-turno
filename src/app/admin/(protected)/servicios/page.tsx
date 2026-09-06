import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { crearServicio } from "./actions";
import { ServicioRow } from "./servicio-row";
import { FotoInput } from "../foto-input";

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

      <form
        action={crearServicio}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <FotoInput name="foto" label="Foto (opcional)" forma="cuadrado" />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
          <input
            name="nombre"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Duración (min)</label>
          <input
            name="duracion_minutos"
            type="number"
            min={1}
            required
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Precio ($)</label>
          <input
            name="precio"
            type="number"
            min={0}
            step="0.01"
            required
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Agregar
        </button>
      </form>

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
