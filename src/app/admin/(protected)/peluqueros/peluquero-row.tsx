"use client";

import { useState } from "react";
import { Pencil, Trash2, Phone, Check, X, User } from "lucide-react";
import type { Peluquero, Servicio } from "@/types/database";
import { actualizarPeluquero, eliminarPeluquero } from "./actions";
import { ServiciosDelPeluquero } from "./servicios-del-peluquero";
import { FotoInput } from "../foto-input";

interface PeluqueroRowProps {
  peluquero: Peluquero;
  servicios: Servicio[];
  serviciosAsignadosIds: string[];
}

/** Tarjeta de peluquero, con edición inline. */
export function PeluqueroRow({ peluquero, servicios, serviciosAsignadosIds }: PeluqueroRowProps) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
        <form
          action={async (formData) => {
            await actualizarPeluquero(peluquero.id, formData);
            setEditando(false);
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <FotoInput name="foto" label="Foto" fotoUrlActual={peluquero.foto_url} forma="circulo" />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
            <input
              name="nombre"
              defaultValue={peluquero.nombre}
              required
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">WhatsApp</label>
            <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white">
              <span className="flex items-center bg-gray-50 px-2 text-sm text-gray-500">+549</span>
              <input
                type="tel"
                name="telefono_whatsapp"
                defaultValue={peluquero.telefono_whatsapp.replace(/^549/, "")}
                required
                placeholder="3534196213"
                className="min-w-0 flex-1 px-2 py-1.5 text-sm outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-1.5 pb-1.5 text-sm text-gray-600">
            <input type="checkbox" name="activo" defaultChecked={peluquero.activo} />
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

        <div className="mt-3 border-t border-violet-100 pt-3">
          <ServiciosDelPeluquero
            peluqueroId={peluquero.id}
            servicios={servicios}
            asignadosIds={serviciosAsignadosIds}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-50 text-violet-300">
            {peluquero.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={peluquero.foto_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5" strokeWidth={1.8} />
            )}
          </div>
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">{peluquero.nombre}</h3>
            <span
              className={
                peluquero.activo
                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                  : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
              }
            >
              {peluquero.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
            <Phone className="h-3 w-3 shrink-0" strokeWidth={1.8} />
            {peluquero.telefono_whatsapp}
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
              if (confirm(`¿Eliminar a ${peluquero.nombre}? Esta acción no se puede deshacer.`)) {
                eliminarPeluquero(peluquero.id);
              }
            }}
            title="Eliminar"
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <ServiciosDelPeluquero
          peluqueroId={peluquero.id}
          servicios={servicios}
          asignadosIds={serviciosAsignadosIds}
        />
      </div>
    </div>
  );
}
