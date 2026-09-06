"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";

/** Input de archivo opcional con preview, para la foto de un peluquero o servicio. */
export function FotoInput({
  name,
  label,
  fotoUrlActual,
  forma = "circulo",
}: {
  name: string;
  label: string;
  fotoUrlActual?: string | null;
  forma?: "circulo" | "cuadrado";
}) {
  const [preview, setPreview] = useState<string | null>(fotoUrlActual ?? null);
  const formaClase = forma === "circulo" ? "rounded-full" : "rounded-lg";

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <label
        className={`group relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-500 ${formaClase}`}
      >
        {preview ? (
          // Preview local (blob:) o foto ya guardada: no requiere el loader de next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
        )}
        <input
          type="file"
          name={name}
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) setPreview(URL.createObjectURL(archivo));
          }}
        />
      </label>
    </div>
  );
}
