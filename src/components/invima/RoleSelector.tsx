"use client";

import type { Rol } from "@/lib/invima/types";

const ROLES: { id: Rol; label: string }[] = [
  { id: "solicitante", label: "Solicitante" },
  { id: "revision_interna", label: "Revisión Interna" },
  { id: "decision", label: "Firma de Resolución" },
  { id: "validacion_publica", label: "Validación Pública" },
];

export function RoleSelector({
  rolActivo,
  onCambiarRol,
}: {
  rolActivo: Rol;
  onCambiarRol: (rol: Rol) => void;
}) {
  return (
    <nav className="glass flex w-full gap-1 overflow-x-auto rounded-full p-1">
      {ROLES.map((rol) => {
        const activo = rol.id === rolActivo;
        return (
          <button
            key={rol.id}
            onClick={() => onCambiarRol(rol.id)}
            className={
              activo
                ? "gladwell-gradient flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg transition-all"
                : "flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
            }
          >
            {rol.label}
          </button>
        );
      })}
    </nav>
  );
}
