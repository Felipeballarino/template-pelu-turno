"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { crearPeluquero } from "./actions";
import { FotoInput } from "../foto-input";

/**
 * Alta de peluquero. Antes era un <form action={crearPeluquero}> directo:
 * si la acción tiraba error no se veía ningún aviso (quedaba pegado en el
 * error boundary o ni eso), y al tener éxito ni el formulario ni la
 * preview de la foto se limpiaban porque son inputs no controlados que
 * React no resetea solo. Acá se maneja el submit a mano para poder mostrar
 * error/éxito y resetear todo explícitamente.
 */
export function NuevoPeluqueroForm() {
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
        await crearPeluquero(data);
        form.reset();
        setFotoKey((k) => k + 1); // fuerza remount de FotoInput para limpiar la preview
        setExito(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo agregar el peluquero.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <FotoInput key={fotoKey} name="foto" label="Foto (opcional)" forma="circulo" />
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
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" strokeWidth={1.8} />
        {pending ? "Agregando..." : "Agregar"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {exito && <p className="w-full text-sm text-emerald-600">Peluquero agregado.</p>}
    </form>
  );
}
