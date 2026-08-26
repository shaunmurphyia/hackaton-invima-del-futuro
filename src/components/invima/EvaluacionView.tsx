"use client";

import { useState } from "react";
import { actualizarExpediente } from "@/lib/invima/data";
import type { Expediente } from "@/lib/invima/types";
import { Badge, PrimaryButton, SecondaryButton } from "./ui";

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
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Consola de Evaluación Paralela (Mesa Técnica)
        </h2>
        {enEvaluacion.length === 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            No hay expedientes en evaluación concurrente.
          </p>
        )}
      </div>
      {enEvaluacion.map((exp) => (
        <div key={exp.id} className="glass-strong flex flex-col gap-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">{exp.producto_nombre}</p>
            <span className="text-xs text-muted-foreground">
              Ciclos de subsanación: {exp.ciclos_subsanacion} / 2
            </span>
          </div>
          <Badge tone="accent">Sala {exp.formatos?.sala}</Badge>

          <div className="grid gap-4 sm:grid-cols-3">
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
                      <PrimaryButton
                        onClick={() => firmar(exp, area.id)}
                        className="mt-2 w-full"
                      >
                        Firma Concurrente
                      </PrimaryButton>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <SecondaryButton
            onClick={() => solicitarSubsanacion(exp)}
            className="self-start"
          >
            Solicitar subsanación
          </SecondaryButton>
        </div>
      ))}
    </div>
  );
}
