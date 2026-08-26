import { ApiProperty } from '@nestjs/swagger';

export class ResearchResponseDto {
  @ApiProperty({ example: 'd3c2b1a0-9876-5432-10fe-dcba98765432' })
  id: string;

  @ApiProperty({ example: 'f8e7d6c5-b4a3-2109-8765-43210fedcba9' })
  molecule_id: string;

  @ApiProperty({ example: 'PubChem / FDA / Regulatory Agent' })
  provider: string;

  @ApiProperty({
    example:
      'Analgésico y antipirético de primera línea. Actúa inhibiendo la síntesis de prostaglandinas.',
  })
  summary: string;

  @ApiProperty({
    example: ['Tratamiento sintomático del dolor', 'Estados febriles'],
  })
  indications: string[];

  @ApiProperty({
    example: ['Hipersensibilidad conocida', 'Insuficiencia hepatocelular grave'],
  })
  contraindications: string[];

  @ApiProperty({
    example: { source: 'PubChem PUG & US-FDA Monograph Catalog' },
  })
  raw_data: Record<string, any>;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z' })
  created_at: string;
}
