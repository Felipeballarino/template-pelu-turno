"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { crearServicio } from "./actions";
import { FotoInput } from "../foto-input";

/** Alta de servicio. Ver nuevo-peluquero-form.tsx para el motivo del manejo manual del submit. */
export function NuevoServicioForm() {
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fotoKey, setFotoKey] = useState(0);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setExito(false);

    const form = event.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      try {
        await crearServicio(data);
        form.reset();
        setFotoKey((k) => k + 1);
        setExito(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo agregar el servicio.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <FotoInput key={fotoKey} name="foto" label="Foto (opcional)" forma="cuadrado" />
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
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        {pending ? "Agregando..." : "Agregar"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {exito && <p className="w-full text-sm text-emerald-600">Servicio agregado.</p>}
    </form>
  );
}
