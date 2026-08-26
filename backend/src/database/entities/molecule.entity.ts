import { ApiProperty } from '@nestjs/swagger';

export enum MoleculeStatus {
  DETECTED = 'DETECTED',
  RESEARCHING = 'RESEARCHING',
  RESEARCHED = 'RESEARCHED',
  VALIDATED = 'VALIDATED',
}

export class MoleculeEntity {
  @ApiProperty({ example: 'f8e7d6c5-b4a3-2109-8765-43210fedcba9', description: 'UUID único de la molécula' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID del documento de origen' })
  document_id: string;

  @ApiProperty({ example: 'Paracetamol', description: 'Nombre de la molécula / principio activo / DCI' })
  name: string;

  @ApiProperty({ example: 'C8H9NO2', description: 'Fórmula molecular química', required: false })
  formula?: string;

  @ApiProperty({ example: '103-90-2', description: 'Número de registro CAS', required: false })
  cas_number?: string;

  @ApiProperty({ example: 151.16, description: 'Peso molecular en g/mol', required: false })
  molecular_weight?: number;

  @ApiProperty({ example: 0.98, description: 'Nivel de confianza de detección (0.0 a 1.0)' })
  confidence_score: number;

  @ApiProperty({ enum: MoleculeStatus, example: MoleculeStatus.DETECTED, description: 'Estado del análisis de la molécula' })
  status: MoleculeStatus;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z', description: 'Fecha de detección' })
  created_at: string;
}
