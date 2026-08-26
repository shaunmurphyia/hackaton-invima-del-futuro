"use client";

import { useEffect, useRef, useState } from "react";
import {
  actualizarExpediente,
  crearExpediente,
  evaluarConformidadInvima,
  listarFormatos,
} from "@/lib/invima/data";
import type { Expediente, Formato } from "@/lib/invima/types";
import {
  Badge,
  Field,
  PrimaryButton,
  SecondaryButton,
  Section,
  SectionHeader,
  Select,
  TextInput,
  Textarea,
} from "./ui";

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
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [extrayendoPdf, setExtrayendoPdf] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [validandoConformidad, setValidandoConformidad] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listarFormatos().then(setFormatos);
  }, []);

  async function onSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setArchivoPdf(archivo);
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
      let conformidad: Awaited<ReturnType<typeof evaluarConformidadInvima>> | null =
        null;
      if (archivoPdf) {
        setValidandoConformidad(true);
        try {
          conformidad = await evaluarConformidadInvima(archivoPdf);
        } catch (err) {
          console.error("No se pudo validar conformidad práctica INVIMA:", err);
        } finally {
          setValidandoConformidad(false);
        }
      }

      await crearExpediente({
        producto_nombre: nombreProducto.trim(),
        solicitante_email: SOLICITANTE_EMAIL_DEMO,
        dossier_texto: dossierTexto,
        formato_codigo: formatoCodigo,
        ...(conformidad && {
          invima_compliance_score: conformidad.score,
          invima_compliance_status: conformidad.status,
          invima_compliance_json: conformidad,
        }),
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
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Portal de Radicación Digital
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube el <strong className="text-foreground">dossier</strong> en PDF
          (Módulo 2 del e-CTD) — el documento que mueve todo el flujo.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader>Datos del expediente</SectionHeader>
        <Section>
          <Field label="Nombre del producto">
            <TextInput
              value={nombreProducto}
              onChange={(e) => setNombreProducto(e.target.value)}
            />
          </Field>
          <Field
            label="Formato de radicación"
            hint="Determina la sala que evaluará tu expediente."
          >
            <Select
              value={formatoCodigo}
              onChange={(e) => setFormatoCodigo(e.target.value)}
            >
              <option value="">Selecciona el formato aplicable...</option>
              {formatos.map((f) => (
                <option key={f.codigo} value={f.codigo}>
                  {f.codigo} · {f.medicamentos} · {f.nombre}
                </option>
              ))}
            </Select>
          </Field>
        </Section>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader>Dossier técnico</SectionHeader>
        <Section>
          <Field label="Documento">
            <div className="flex flex-wrap items-center gap-3">
              <SecondaryButton
                type="button"
                onClick={() => inputArchivoRef.current?.click()}
                disabled={extrayendoPdf}
              >
                {extrayendoPdf ? "Leyendo PDF..." : "Subir dossier (.pdf)"}
              </SecondaryButton>
              <input
                ref={inputArchivoRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={onSeleccionarArchivo}
              />
              {nombreArchivo && (
                <span className="text-xs text-muted-foreground">
                  {nombreArchivo}
                </span>
              )}
            </div>
          </Field>
          <Field label="Texto extraído (editable)">
            <Textarea
              value={dossierTexto}
              onChange={(e) => {
                setDossierTexto(e.target.value);
                setNombreArchivo(null);
              }}
              rows={6}
              className="text-xs"
            />
          </Field>
        </Section>
      </div>

      <PrimaryButton
        onClick={radicar}
        disabled={cargando || !dossierTexto.trim() || !formatoCodigo}
        className="self-start"
      >
        {validandoConformidad
          ? "Validando conformidad práctica INVIMA..."
          : cargando
            ? "Radicando..."
            : "Radicar expediente"}
      </PrimaryButton>

      <div className="flex flex-col gap-2">
        <SectionHeader>Mis expedientes</SectionHeader>
        {misExpedientes.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            Todavía no has radicado ningún expediente.
          </p>
        ) : (
          <Section>
            {misExpedientes.map((exp) => (
              <div key={exp.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {exp.producto_nombre}
                  </p>
                  <Badge>{ESTADO_LABEL[exp.estado] ?? exp.estado}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {exp.formatos?.codigo} · Sala {exp.formatos?.sala}
                  </span>
                  {exp.invima_compliance_score != null && (
                    <span>
                      · Conformidad práctica: {exp.invima_compliance_score}% (
                      {exp.invima_compliance_status})
                    </span>
                  )}
                  <span>· Ciclos de subsanación: {exp.ciclos_subsanacion} / 2</span>
                </div>
                {exp.solicitud_subsanacion_activa && exp.ciclos_subsanacion < 2 && (
                  <SecondaryButton
                    onClick={() => subsanar(exp)}
                    disabled={cargando}
                    className="self-start"
                  >
                    Responder subsanación y reenviar
                  </SecondaryButton>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
