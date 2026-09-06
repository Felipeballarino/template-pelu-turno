"use client";

import { useState } from "react";
import { Pencil, Trash2, Clock, Check, X, Scissors } from "lucide-react";
import type { Servicio } from "@/types/database";
import { actualizarServicio, eliminarServicio } from "./actions";
import { FotoInput } from "../foto-input";

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Tarjeta de servicio, con edición inline. */
export function ServicioRow({ servicio }: { servicio: Servicio }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
        <form
          action={async (formData) => {
            await actualizarServicio(servicio.id, formData);
            setEditando(false);
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <FotoInput name="foto" label="Foto" fotoUrlActual={servicio.foto_url} forma="cuadrado" />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
            <input
              name="nombre"
              defaultValue={servicio.nombre}
              required
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Duración (min)</label>
            <input
              name="duracion_minutos"
              type="number"
              min={1}
              defaultValue={servicio.duracion_minutos}
              required
              className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Precio ($)</label>
            <input
              name="precio"
              type="number"
              min={0}
              step="0.01"
              defaultValue={servicio.precio}
              required
              className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <label className="flex items-center gap-1.5 pb-1.5 text-sm text-gray-600">
            <input type="checkbox" name="activo" defaultChecked={servicio.activo} />
            Activo
          </label>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="submit"
              title="Guardar"
              className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              title="Cancelar"
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-violet-50 text-violet-300">
          {servicio.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={servicio.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Scissors className="h-5 w-5" strokeWidth={1.8} />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">{servicio.nombre}</h3>
            <span
              className={
                servicio.activo
                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                  : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
              }
            >
              {servicio.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" strokeWidth={1.8} />
              {servicio.duracion_minutos} min
            </span>
            <span className="font-medium text-gray-500">{formatoPrecio.format(servicio.precio)}</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => setEditando(true)}
          title="Editar"
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button
          onClick={() => {
            if (confirm(`¿Eliminar "${servicio.nombre}"? Esta acción no se puede deshacer.`)) {
              eliminarServicio(servicio.id);
            }
          }}
          title="Eliminar"
          className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
