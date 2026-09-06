import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Sube (si vino un archivo) la foto opcional de un peluquero o servicio al
 * bucket público "fotos" y devuelve su URL pública. Si el campo viene vacío
 * (el usuario no eligió ninguna foto), devuelve `undefined` para que quien
 * llama no toque el `foto_url` ya guardado.
 */
export async function subirFotoOpcional(
  supabase: SupabaseClient<Database>,
  formData: FormData,
  campo: string,
  carpeta: "peluqueros" | "servicios"
): Promise<string | undefined> {
  const archivo = formData.get(campo);

  if (!(archivo instanceof File) || archivo.size === 0) {
    return undefined;
  }

  if (!archivo.type.startsWith("image/")) {
    throw new Error("La foto tiene que ser una imagen.");
  }
  if (archivo.size > TAMANIO_MAXIMO_BYTES) {
    throw new Error("La foto no puede pesar más de 5 MB.");
  }

  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const ruta = `${carpeta}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("fotos").upload(ruta, archivo, {
    contentType: archivo.type,
  });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);

  return supabase.storage.from("fotos").getPublicUrl(ruta).data.publicUrl;
}
