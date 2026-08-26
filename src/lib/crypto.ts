export async function generarBlockchainHash(expediente: {
  id: string;
  producto_nombre: string;
  principio_activo: string;
  endpoints_clinicos: string;
  especificaciones_calidad: string;
  umbra_score_beneficio: number;
  umbra_score_riesgo: number;
}): Promise<string> {
  const payload = `${expediente.id}-${expediente.producto_nombre}-${expediente.principio_activo}-${expediente.endpoints_clinicos}-${expediente.especificaciones_calidad}-${expediente.umbra_score_beneficio}-${expediente.umbra_score_riesgo}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
