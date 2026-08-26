import { ApiProperty } from '@nestjs/swagger';
import { MoleculeStatus } from '../../../database/entities/molecule.entity';

export class MoleculeResponseDto {
  @ApiProperty({ example: 'f8e7d6c5-b4a3-2109-8765-43210fedcba9' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  document_id: string;

  @ApiProperty({ example: 'Paracetamol' })
  name: string;

  @ApiProperty({ example: 'C8H9NO2', required: false })
  formula?: string;

  @ApiProperty({ example: '103-90-2', required: false })
  cas_number?: string;

  @ApiProperty({ example: 151.16, required: false })
  molecular_weight?: number;

  @ApiProperty({ example: 0.98 })
  confidence_score: number;

  @ApiProperty({ enum: MoleculeStatus, example: MoleculeStatus.DETECTED })
  status: MoleculeStatus;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z' })
  created_at: string;
}

export class ExtractMoleculesResponseDto {
  @ApiProperty({ example: 2, description: 'Número total de moléculas detectadas' })
  count: number;

  @ApiProperty({ type: [MoleculeResponseDto], description: 'Listado de moléculas identificadas y persistidas' })
  molecules: MoleculeResponseDto[];
}
