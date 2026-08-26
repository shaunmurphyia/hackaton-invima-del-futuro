import { ApiProperty } from '@nestjs/swagger';
import { DocumentEntity } from '../../../database/entities/document.entity';
import { MoleculeEntity } from '../../../database/entities/molecule.entity';
import { ResearchEntity } from '../../../database/entities/research.entity';
import { InvimaComplianceResultDto } from './invima-compliance.dto';

export class EnrichedMoleculeReportDto extends MoleculeEntity {
  @ApiProperty({
    type: [ResearchEntity],
    description: 'Historial de investigaciones científicas asociadas a la molécula',
  })
  researchFindings: ResearchEntity[];
}

export class ConsolidatedDossierReportDto {
  @ApiProperty({ type: DocumentEntity, description: 'Metadatos y estado del expediente regulatorio' })
  document: DocumentEntity;

  @ApiProperty({ example: 2, description: 'Total de moléculas activas detectadas en el expediente' })
  totalMolecules: number;

  @ApiProperty({ example: 2, description: 'Total de moléculas con investigación científica completada' })
  researchedMoleculesCount: number;

  @ApiProperty({
    type: [EnrichedMoleculeReportDto],
    description: 'Listado completo de moléculas con sus fichas de investigación clínica y regulatoria',
  })
  molecules: EnrichedMoleculeReportDto[];

  @ApiProperty({
    type: InvimaComplianceResultDto,
    description: 'Auditoría y dictamen de conformidad regulatoria INVIMA (Decreto 677/1782)',
  })
  invimaCompliance: InvimaComplianceResultDto;

  @ApiProperty({
    example:
      'Expediente CTD analizado con éxito. Se detectaron 2 principios activos principales con monografías regulatorias validadas.',
    description: 'Conclusión ejecutiva del expediente',
  })
  executiveSummary: string;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z', description: 'Fecha de generación del reporte' })
  generatedAt: string;
}
