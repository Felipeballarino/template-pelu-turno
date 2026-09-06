import type { LucideIcon } from "lucide-react";

const COLORES = {
  violeta: "bg-violet-50 text-violet-600",
  verde: "bg-emerald-50 text-emerald-600",
  ambar: "bg-amber-50 text-amber-600",
  gris: "bg-gray-100 text-gray-500",
} as const;

export function StatTile({
  icono: Icono,
  valor,
  etiqueta,
  color = "violeta",
}: {
  icono: LucideIcon;
  valor: number | string;
  etiqueta: string;
  color?: keyof typeof COLORES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${COLORES[color]}`}>
        <Icono className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight text-gray-900">{valor}</p>
        <p className="truncate text-xs text-gray-500">{etiqueta}</p>
      </div>
    </div>
  );
}
