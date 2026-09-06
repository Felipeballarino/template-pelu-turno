"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subirFotoOpcional } from "@/lib/supabase/fotos";

export async function crearServicio(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const duracion_minutos = Number(formData.get("duracion_minutos"));
  const precio = Number(formData.get("precio"));

  if (!nombre || !duracion_minutos || duracion_minutos <= 0 || precio < 0 || Number.isNaN(precio)) {
    throw new Error("Datos inválidos: revisá nombre, duración y precio.");
  }

  const supabase = await createClient();
  const foto_url = await subirFotoOpcional(supabase, formData, "foto", "servicios");
  const { error } = await supabase
    .from("servicios")
    .insert({ nombre, duracion_minutos, precio, foto_url });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/servicios");
}

export async function actualizarServicio(id: string, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const duracion_minutos = Number(formData.get("duracion_minutos"));
  const precio = Number(formData.get("precio"));
  const activo = formData.get("activo") === "on";

  if (!nombre || !duracion_minutos || duracion_minutos <= 0 || precio < 0 || Number.isNaN(precio)) {
    throw new Error("Datos inválidos: revisá nombre, duración y precio.");
  }

  const supabase = await createClient();
  // Si no se eligió una foto nueva, no se toca foto_url (se conserva la que ya había).
  const foto_url = await subirFotoOpcional(supabase, formData, "foto", "servicios");
  const { error } = await supabase
    .from("servicios")
    .update({ nombre, duracion_minutos, precio, activo, ...(foto_url !== undefined && { foto_url }) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/servicios");
}

export async function eliminarServicio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("servicios").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/servicios");
}
