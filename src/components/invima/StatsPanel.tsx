const METRICAS = [
  { label: "Admisión", valor: "-80%", detalle: "vs. radicación en papel" },
  { label: "Transcripción por IA", valor: "-90%", detalle: "extracción e-CTD" },
  { label: "Firmas", valor: "instantáneas", detalle: "Smart Contract" },
  { label: "Ciclos de subsanación", valor: "máx. 2", detalle: "regla ZAZIBONA" },
];

export function StatsPanel() {
  return (
    <aside className="glass-strong flex w-full flex-col gap-4 rounded-2xl p-5 lg:w-64">
      <h2 className="gladwell-gradient-text text-sm font-semibold uppercase tracking-wider">
        Ahorros del flujo
      </h2>
      <div className="flex flex-col gap-3">
        {METRICAS.map((m) => (
          <div key={m.label} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
            <p className="text-2xl font-bold text-foreground">{m.valor}</p>
            <p className="text-sm text-foreground/90">{m.label}</p>
            <p className="text-xs text-muted-foreground">{m.detalle}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
