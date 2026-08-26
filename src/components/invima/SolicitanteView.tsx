"use client";

import { useEffect, useRef, useState } from "react";
import { actualizarExpediente, crearExpediente, listarFormatos } from "@/lib/invima/data";
import type { Expediente, Formato } from "@/lib/invima/types";

const DOSSIER_EJEMPLO = `Módulo 2 - Resumen Clínico y de Calidad.
Producto de investigación: Vaxinol-CR 20mg (código interno VXC-20).
Ingrediente Farmacéutico Activo: Cralotinib mesilato.
Estudio fase III, n=482 pacientes, endpoint primario de supervivencia libre de progresión a 12 meses alcanzado en 71% de los pacientes tratados vs 44% en el grupo control (p<0.001).
Especificaciones de calidad: pureza >= 99.2%, síntesis por vía catalítica asimétrica, conservación entre 2-8°C protegido de luz.`;

const SOLICITANTE_EMAIL_DEMO = "regulatorio@laboratoriosabc.com";

const ESTADO_LABEL: Record<string, string> = {
  en_triaje: "En triaje",
  en_evaluacion: "En evaluación",
  subsanando: "Subsanando",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

async function extraerTextoPdf(archivo: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await archivo.arrayBuffer();
  const documento = await pdfjsLib.getDocument({ data: buffer }).promise;
  let texto = "";
  for (let i = 1; i <= documento.numPages; i++) {
    const pagina = await documento.getPage(i);
    const contenido = await pagina.getTextContent();
    texto +=
      contenido.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ") + "\n";
  }
  return texto.trim();
}

export function SolicitanteView({
  expedientes,
  onRefrescar,
}: {
  expedientes: Expediente[];
  onRefrescar: () => void;
}) {
  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [formatoCodigo, setFormatoCodigo] = useState("");
  const [nombreProducto, setNombreProducto] = useState("Vaxinol-CR 20mg");
  const [dossierTexto, setDossierTexto] = useState(DOSSIER_EJEMPLO);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [extrayendoPdf, setExtrayendoPdf] = useState(false);
  const [cargando, setCargando] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listarFormatos().then(setFormatos);
  }, []);

  async function onSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setExtrayendoPdf(true);
    try {
      const texto = await extraerTextoPdf(archivo);
      setDossierTexto(texto);
      setNombreArchivo(archivo.name);
    } finally {
      setExtrayendoPdf(false);
    }
  }

  async function radicar() {
    if (!dossierTexto.trim() || !nombreProducto.trim() || !formatoCodigo) return;
    setCargando(true);
    try {
      await crearExpediente({
        producto_nombre: nombreProducto.trim(),
        solicitante_email: SOLICITANTE_EMAIL_DEMO,
        dossier_texto: dossierTexto,
        formato_codigo: formatoCodigo,
      });
      onRefrescar();
    } finally {
      setCargando(false);
    }
  }

  async function subsanar(exp: Expediente) {
    setCargando(true);
    try {
      await actualizarExpediente(exp.id, {
        estado: "en_triaje",
        solicitud_subsanacion_activa: false,
      });
      onRefrescar();
    } finally {
      setCargando(false);
    }
  }

  const misExpedientes = expedientes.filter(
    (e) => e.solicitante_email === SOLICITANTE_EMAIL_DEMO,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Portal de Radicación Digital
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube el <strong>dossier</strong> en PDF (Módulo 2 del e-CTD) — el
          documento que mueve todo el flujo.
        </p>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Formato de radicación
        </label>
        <select
          value={formatoCodigo}
          onChange={(e) => setFormatoCodigo(e.target.value)}
          className="modal-field mt-1"
        >
          <option value="">Selecciona el formato aplicable...</option>
          {formatos.map((f) => (
            <option key={f.codigo} value={f.codigo}>
              {f.codigo} · {f.medicamentos} · {f.nombre}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Nombre del producto
        </label>
        <input
          value={nombreProducto}
          onChange={(e) => setNombreProducto(e.target.value)}
          className="modal-field mt-1"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => inputArchivoRef.current?.click()}
            disabled={extrayendoPdf}
            className="rounded-full border border-border bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {extrayendoPdf ? "Leyendo PDF..." : "Subir dossier (.pdf)"}
          </button>
          <input
            ref={inputArchivoRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={onSeleccionarArchivo}
          />
          {nombreArchivo && (
            <span className="text-xs text-muted-foreground">{nombreArchivo}</span>
          )}
        </div>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Texto extraído del dossier (editable)
        </label>
        <textarea
          value={dossierTexto}
          onChange={(e) => {
            setDossierTexto(e.target.value);
            setNombreArchivo(null);
          }}
          rows={6}
          className="modal-field modal-textarea mt-1 text-xs"
        />

        <button
          onClick={radicar}
          disabled={cargando || !dossierTexto.trim() || !formatoCodigo}
          className="gladwell-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-opacity disabled:opacity-50"
        >
          {cargando ? "Radicando..." : "Radicar expediente"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Mis expedientes
        </h3>
        {misExpedientes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no has radicado ningún expediente.
          </p>
        )}
        {misExpedientes.map((exp) => (
          <div key={exp.id} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{exp.producto_nombre}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                {ESTADO_LABEL[exp.estado] ?? exp.estado}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {exp.formatos?.codigo} · Sala {exp.formatos?.sala}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ciclos de subsanación: {exp.ciclos_subsanacion} / 2
            </p>
            {exp.solicitud_subsanacion_activa && exp.ciclos_subsanacion < 2 && (
              <button
                onClick={() => subsanar(exp)}
                disabled={cargando}
                className="mt-3 rounded-full border border-border bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Responder subsanación y reenviar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
