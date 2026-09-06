import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { crearPeluquero } from "./actions";
import { PeluqueroRow } from "./peluquero-row";
import { FotoInput } from "../foto-input";

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

      <form
        action={crearPeluquero}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <FotoInput name="foto" label="Foto (opcional)" forma="circulo" />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
          <input
            name="nombre"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            WhatsApp (código de área + número, sin 0 ni 15)
          </label>
          <div className="flex overflow-hidden rounded-lg border border-gray-300 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
            <span className="flex items-center bg-gray-50 px-2 text-sm text-gray-500">+549</span>
            <input
              type="tel"
              name="telefono_whatsapp"
              required
              placeholder="3534196213"
              className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          <UserPlus className="h-4 w-4" strokeWidth={1.8} />
          Agregar
        </button>
      </form>

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
