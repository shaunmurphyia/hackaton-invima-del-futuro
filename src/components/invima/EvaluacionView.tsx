"use client";

import { useState } from "react";
import { actualizarExpediente } from "@/lib/invima/data";
import type { Expediente } from "@/lib/invima/types";

type Area = "seguridad" | "legal" | "calidad";

const AREAS: { id: Area; label: string }[] = [
  { id: "seguridad", label: "Seguridad" },
  { id: "legal", label: "Legal" },
  { id: "calidad", label: "Calidad y Eficacia" },
];

export function EvaluacionView({
  expedientes,
  onRefrescar,
}: {
  expedientes: Expediente[];
  onRefrescar: () => void;
}) {
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const enEvaluacion = expedientes.filter((e) => e.estado === "en_evaluacion");

  function comentarioKey(expId: string, area: Area) {
    return `${expId}:${area}`;
  }

  async function firmar(exp: Expediente, area: Area) {
    const comentario = comentarios[comentarioKey(exp.id, area)] ?? "Sin observaciones";
    await actualizarExpediente(exp.id, {
      [`aprobado_${area}`]: true,
      [`comentario_${area}`]: comentario,
    } as Partial<Expediente>);
    onRefrescar();
  }

  async function solicitarSubsanacion(exp: Expediente) {
    const nuevosCiclos = exp.ciclos_subsanacion + 1;
    const rechazado = nuevosCiclos >= 2;
    await actualizarExpediente(exp.id, {
      ciclos_subsanacion: nuevosCiclos,
      solicitud_subsanacion_activa: !rechazado,
      estado: rechazado ? "rechazado" : "subsanando",
    });
    onRefrescar();
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">
        Consola de Evaluación Paralela (Mesa Técnica)
      </h2>
      {enEvaluacion.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay expedientes en evaluación concurrente.
        </p>
      )}
      {enEvaluacion.map((exp) => (
        <div key={exp.id} className="glass-strong rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">{exp.producto_nombre}</p>
            <span className="text-xs text-muted-foreground">
              Ciclos de subsanación: {exp.ciclos_subsanacion} / 2
            </span>
          </div>
          <span className="gladwell-gradient mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium text-white">
            Sala {exp.formatos?.sala}
          </span>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {AREAS.map((area) => {
              const aprobado = exp[`aprobado_${area.id}`];
              return (
                <div key={area.id} className="glass rounded-xl p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {area.label}
                  </p>
                  {aprobado ? (
                    <p className="mt-2 text-xs text-accent">
                      Firmado — {exp[`comentario_${area.id}`]}
                    </p>
                  ) : (
                    <>
                      <textarea
                        placeholder="Concepto técnico..."
                        className="modal-field modal-textarea mt-2 text-xs"
                        rows={2}
                        onChange={(e) =>
                          setComentarios((prev) => ({
                            ...prev,
                            [comentarioKey(exp.id, area.id)]: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() => firmar(exp, area.id)}
                        className="gladwell-gradient mt-2 w-full rounded-full px-3 py-2 text-xs font-medium text-white"
                      >
                        Firma Concurrente
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => solicitarSubsanacion(exp)}
            className="mt-4 rounded-full border border-border bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
          >
            Solicitar subsanación
          </button>
        </div>
      ))}
    </div>
  );
}
