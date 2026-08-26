import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '../../../database/entities/document.entity';

export class DocumentResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Dossier_CTD_Modulo3_Paracetamol.pdf' })
  filename: string;

  @ApiProperty({ example: 'application/pdf' })
  mime_type: string;

  @ApiProperty({ example: 1048576 })
  file_size_bytes: number;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.PROCESSED })
  status: DocumentStatus;

  @ApiProperty({ example: 'Texto completo del documento...', required: false })
  raw_text?: string;

  @ApiProperty({ example: 'Resumen del expediente...', required: false })
  summary?: string;

  @ApiProperty({ example: { totalPages: 12 } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z', required: false })
  updated_at?: string;
}
