import { ApiProperty } from '@nestjs/swagger';

export interface InvimaCheckItem {
  code: string;
  requirement: string;
  category: 'LEGAL' | 'QUALITY_CTD_M3' | 'STABILITY_ZONA_IVB' | 'BIOEQUIVALENCE' | 'PHARMACOVIGILANCE';
  status: 'COMPLIANT' | 'WARNING' | 'ACTION_REQUIRED';
  details: string;
  regulationReference: string;
}

export class InvimaComplianceResultDto {
  @ApiProperty({ example: 88, description: 'Score de conformidad regulatoria INVIMA (0 a 100)' })
  score: number;

  @ApiProperty({ example: 'EVALUADO_APTO_CON_OBSERVACIONES', description: 'Dictamen preliminar regulatorio' })
  status: 'CONFORME' | 'EVALUADO_APTO_CON_OBSERVACIONES' | 'REQUIERE_SUBSANACION' | 'NO_CONFORME';

  @ApiProperty({ example: 'SÍNTESIS QUÍMICA', description: 'Clasificación del producto según INVIMA' })
  productCategory: 'SÍNTESIS QUÍMICA' | 'MEDICAMENTO BIOLÓGICO / BIOTECNOLÓGICO' | 'FITOTERAPÉUTICO';

  @ApiProperty({ example: 'Decreto 677 de 1995 / Resolución 1124 de 2016', description: 'Normativa colombiana aplicable' })
  applicableRegulations: string[];

  @ApiProperty({
    example: 'Zona Climática IVB (30°C ± 2°C / 75% HR ± 5% HR)',
    description: 'Condición de estabilidad exigida por Colombia',
  })
  stabilityZoneRequirement: string;

  @ApiProperty({
    description: 'Lista detallada de verificaciones regulatorias',
  })
  checkpoints: InvimaCheckItem[];

  @ApiProperty({
    example: [
      'Verificar certificado de Buenas Prácticas de Manufactura (BPM) vigente emitido o reconocido por INVIMA.',
      'Asegurar inclusión de datos de estabilidad acelerada y a largo plazo en Zona IVB.',
    ],
    description: 'Recomendaciones y próximos pasos para radicación',
  })
  regulatoryRecommendations: string[];
}
