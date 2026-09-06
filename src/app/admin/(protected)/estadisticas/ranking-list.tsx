export interface RankingItem {
  id: string;
  label: string;
  cantidad: number;
}

/** Lista de barras horizontales, ordenadas de mayor a menor cantidad. */
export function RankingList({ items, vacioTexto }: { items: RankingItem[]; vacioTexto: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">{vacioTexto}</p>;
  }

  const max = Math.max(...items.map((i) => i.cantidad), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium text-gray-700">{item.label}</span>
            <span className="shrink-0 text-gray-500">{item.cantidad}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${(item.cantidad / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
