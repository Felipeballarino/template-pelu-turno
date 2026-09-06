"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizarTelefonoArgentino } from "@/lib/telefono";
import { subirFotoOpcional } from "@/lib/supabase/fotos";

export async function crearPeluquero(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefonoInput = String(formData.get("telefono_whatsapp") ?? "").trim();

  if (!nombre || !telefonoInput) {
    throw new Error("Nombre y teléfono son obligatorios.");
  }

  const telefono_whatsapp = normalizarTelefonoArgentino(telefonoInput);
  const supabase = await createClient();
  const foto_url = await subirFotoOpcional(supabase, formData, "foto", "peluqueros");
  const { error } = await supabase.from("peluqueros").insert({ nombre, telefono_whatsapp, foto_url });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/peluqueros");
}

export async function actualizarPeluquero(id: string, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefonoInput = String(formData.get("telefono_whatsapp") ?? "").trim();
  const activo = formData.get("activo") === "on";

  if (!nombre || !telefonoInput) {
    throw new Error("Nombre y teléfono son obligatorios.");
  }

  const telefono_whatsapp = normalizarTelefonoArgentino(telefonoInput);
  const supabase = await createClient();
  // Si no se eligió una foto nueva, no se toca foto_url (se conserva la que ya había).
  const foto_url = await subirFotoOpcional(supabase, formData, "foto", "peluqueros");
  const { error } = await supabase
    .from("peluqueros")
    .update({ nombre, telefono_whatsapp, activo, ...(foto_url !== undefined && { foto_url }) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/peluqueros");
}

export async function eliminarPeluquero(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("peluqueros").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/peluqueros");
}

/**
 * Prende/apaga que un peluquero ofrezca un servicio determinado. Se usa
 * solo cuando el peluquero YA tiene asignaciones explícitas cargadas (ver
 * establecerTodosLosServicios) — si no tuviera ninguna, sacar una sola
 * pasaría a excluir sin querer a todas las demás.
 */
export async function toggleServicioPeluquero(
  peluqueroId: string,
  servicioId: string,
  asignar: boolean
) {
  const supabase = await createClient();

  if (asignar) {
    const { error } = await supabase
      .from("peluquero_servicios")
      .insert({ peluquero_id: peluqueroId, servicio_id: servicioId });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("peluquero_servicios")
      .delete()
      .eq("peluquero_id", peluqueroId)
      .eq("servicio_id", servicioId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/peluqueros");
}

/**
 * Pasa de "ofrece todos los servicios" (sin asignaciones) a asignaciones
 * explícitas, cargando todos los servicios activos de una vez. Así, al
 * destildar "Ofrece todos", arranca con todo tildado y sacar uno de a uno
 * se comporta como se espera, en vez de excluir a todos los demás.
 */
export async function establecerTodosLosServicios(peluqueroId: string, servicioIds: string[]) {
  const supabase = await createClient();

  const { error: errorBorrado } = await supabase
    .from("peluquero_servicios")
    .delete()
    .eq("peluquero_id", peluqueroId);
  if (errorBorrado) throw new Error(errorBorrado.message);

  if (servicioIds.length > 0) {
    const { error } = await supabase
      .from("peluquero_servicios")
      .insert(servicioIds.map((servicio_id) => ({ peluquero_id: peluqueroId, servicio_id })));
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/peluqueros");
}

/** Vuelve a "ofrece todos los servicios" (sin asignaciones explícitas). */
export async function quitarTodasLasAsignaciones(peluqueroId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("peluquero_servicios")
    .delete()
    .eq("peluquero_id", peluqueroId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/peluqueros");
}
