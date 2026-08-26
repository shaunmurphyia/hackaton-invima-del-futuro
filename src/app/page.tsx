"use client";

import { useCallback, useEffect, useState } from "react";
import { DecisionView } from "@/components/invima/DecisionView";
import { RevisionInternaView } from "@/components/invima/RevisionInternaView";
import { RoleSelector } from "@/components/invima/RoleSelector";
import { SolicitanteView } from "@/components/invima/SolicitanteView";
import { StatsPanel } from "@/components/invima/StatsPanel";
import { ValidacionPublicaView } from "@/components/invima/ValidacionPublicaView";
import { listarExpedientes, suscribirseExpedientes } from "@/lib/invima/data";
import type { Expediente, Rol } from "@/lib/invima/types";

export default function Home() {
  const [rolActivo, setRolActivo] = useState<Rol>("solicitante");
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);

  const refrescar = useCallback(async () => {
    setExpedientes(await listarExpedientes());
  }, []);

  useEffect(() => {
    refrescar();
    return suscribirseExpedientes(refrescar);
  }, [refrescar]);

  return (
    <div className="min-h-screen bg-background">
      <header className="portal-header sticky top-0 z-10 flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Hackatón INVIMA del Futuro
          </p>
          <h1 className="gladwell-gradient-text text-xl font-bold">
            Flujo de Modernización Regulatoria
          </h1>
        </div>
        <RoleSelector rolActivo={rolActivo} onCambiarRol={setRolActivo} />
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:flex-row">
        <div className="flex-1">
          {rolActivo === "solicitante" && (
            <SolicitanteView expedientes={expedientes} onRefrescar={refrescar} />
          )}
          {rolActivo === "revision_interna" && (
            <RevisionInternaView expedientes={expedientes} onRefrescar={refrescar} />
          )}
          {rolActivo === "decision" && (
            <DecisionView expedientes={expedientes} onRefrescar={refrescar} />
          )}
          {rolActivo === "validacion_publica" && <ValidacionPublicaView />}
        </div>
        <StatsPanel />
      </main>
    </div>
  );
}
