import { ApiProperty } from '@nestjs/swagger';

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export class DocumentEntity {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'UUID único del documento' })
  id: string;

  @ApiProperty({ example: 'Dossier_CTD_Modulo3_Paracetamol.pdf', description: 'Nombre original del archivo' })
  filename: string;

  @ApiProperty({ example: 'application/pdf', description: 'Tipo MIME del archivo' })
  mime_type: string;

  @ApiProperty({ example: 1048576, description: 'Tamaño del archivo en bytes' })
  file_size_bytes: number;

  @ApiProperty({ example: 'SECCION 3.2.S DROGA SUSTANCIA...', description: 'Texto extraído del expediente' })
  raw_text?: string;

  @ApiProperty({ example: 'Expediente CTD para registro de producto farmacéutico...', description: 'Resumen ejecutivo' })
  summary?: string;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.PROCESSED, description: 'Estado de procesamiento' })
  status: DocumentStatus;

  @ApiProperty({ example: { totalPages: 12, parsedPages: 12 }, description: 'Metadatos adicionales' })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z', description: 'Fecha de subida y procesamiento' })
  created_at: string;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z', description: 'Fecha de última actualización' })
  updated_at?: string;
}
