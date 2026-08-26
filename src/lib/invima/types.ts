export type MetodoFirma = "delegada" | "comite_pleno";

export interface Formato {
  codigo: string;
  nombre: string;
  medicamentos: string;
  sala: string;
}
export type EstadoExpediente =
  | "en_triaje"
  | "en_evaluacion"
  | "subsanando"
  | "aprobado"
  | "rechazado";

export type Rol =
  | "solicitante"
  | "revision_interna"
  | "decision"
  | "validacion_publica";

export interface Expediente {
  id: string;
  created_at: string;
  producto_nombre: string;
  solicitante_email: string;
  dossier_texto: string | null;
  formato_codigo: string | null;
  formatos: Formato | null;
  principio_activo: string | null;
  endpoints_clinicos: string | null;
  especificaciones_calidad: string | null;
  estado_preacta_validado: boolean;
  aprobado_seguridad: boolean;
  aprobado_legal: boolean;
  aprobado_calidad: boolean;
  comentario_seguridad: string | null;
  comentario_legal: string | null;
  comentario_calidad: string | null;
  ciclos_subsanacion: number;
  solicitud_subsanacion_activa: boolean;
  umbra_score_beneficio: number | null;
  umbra_score_riesgo: number | null;
  metodo_firma: MetodoFirma;
  blockchain_hash: string | null;
  estado: EstadoExpediente;
  tiempo_admision_segundos: number | null;
  tiempo_evaluacion_segundos: number | null;
}
