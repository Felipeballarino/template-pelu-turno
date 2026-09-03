import { createClient } from "@/lib/supabase/server";
import { crearPeluquero } from "./actions";
import { PeluqueroRow } from "./peluquero-row";

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
      <h1 className="text-lg font-semibold text-gray-900">Peluqueros</h1>

      <form
        action={crearPeluquero}
        className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-4"
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
          <label className="mb-1 block text-xs font-medium text-gray-600">
            WhatsApp (sin +, ej. 5491122334455)
          </label>
          <input
            name="telefono_whatsapp"
            required
            pattern="[0-9]{10,15}"
            title="Solo números, formato E.164 sin +"
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Agregar
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Nombre</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">WhatsApp</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Servicios</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {peluqueros.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                  Todavía no hay peluqueros cargados.
                </td>
              </tr>
            )}
            {peluqueros.map((p) => (
              <PeluqueroRow
                key={p.id}
                peluquero={p}
                servicios={servicios ?? []}
                serviciosAsignadosIds={
                  (asignaciones ?? [])
                    .filter((a) => a.peluquero_id === p.id)
                    .map((a) => a.servicio_id)
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
