"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearServicio(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const duracion_minutos = Number(formData.get("duracion_minutos"));
  const precio = Number(formData.get("precio"));

  if (!nombre || !duracion_minutos || duracion_minutos <= 0 || precio < 0 || Number.isNaN(precio)) {
    throw new Error("Datos inválidos: revisá nombre, duración y precio.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").insert({ nombre, duracion_minutos, precio });
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
  const { error } = await supabase
    .from("servicios")
    .update({ nombre, duracion_minutos, precio, activo })
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
