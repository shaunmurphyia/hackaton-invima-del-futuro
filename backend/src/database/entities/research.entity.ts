import { ApiProperty } from '@nestjs/swagger';

export class ResearchEntity {
  @ApiProperty({ example: 'd3c2b1a0-9876-5432-10fe-dcba98765432', description: 'UUID único de la investigación' })
  id: string;

  @ApiProperty({ example: 'f8e7d6c5-b4a3-2109-8765-43210fedcba9', description: 'ID de la molécula investigada' })
  molecule_id: string;

  @ApiProperty({ example: 'PubChem / FDA / GeminiAgent', description: 'Fuente o agente que proveyó los datos' })
  provider: string;

  @ApiProperty({ example: { cid: 1983, inchiKey: 'RZVAJINKPMORBT-UHFFFAOYSA-N' }, description: 'Datos técnicos crudos' })
  raw_data: Record<string, any>;

  @ApiProperty({ example: 'Analgésico y antipirético inhibidor de síntesis de prostaglandinas a nivel central.', description: 'Resumen científico' })
  summary: string;

  @ApiProperty({ example: ['Alivio del dolor leve a moderado', 'Fiebre'], description: 'Indicaciones terapéuticas' })
  indications: string[];

  @ApiProperty({ example: ['Hipersensibilidad conocida', 'Insuficiencia hepática severa'], description: 'Contraindicaciones' })
  contraindications: string[];

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z', description: 'Fecha de investigación' })
  created_at: string;
}
