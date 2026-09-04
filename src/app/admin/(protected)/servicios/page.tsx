import { createClient } from "@/lib/supabase/server";
import { crearServicio } from "./actions";
import { ServicioRow } from "./servicio-row";

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
      <h1 className="text-lg font-semibold text-gray-900">Servicios</h1>

      <form
        action={crearServicio}
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
          <input
            name="nombre"
            required
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Duración (min)</label>
          <input
            name="duracion_minutos"
            type="number"
            min={1}
            required
            className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
            className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
        >
          Agregar
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Nombre</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Duración</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Precio</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {servicios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                  Todavía no hay servicios cargados.
                </td>
              </tr>
            )}
            {servicios.map((s) => (
              <ServicioRow key={s.id} servicio={s} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
