import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '../../../database/entities/document.entity';

export class UploadDocumentResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID del documento registrado' })
  id: string;

  @ApiProperty({ example: 'Dossier_CTD_Modulo3_Paracetamol.pdf', description: 'Nombre del archivo' })
  filename: string;

  @ApiProperty({ example: 1048576, description: 'Tamaño del archivo en bytes' })
  file_size_bytes: number;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.PROCESSED, description: 'Estado del procesamiento' })
  status: DocumentStatus;

  @ApiProperty({ example: 12, description: 'Número total de páginas extraídas' })
  totalPages: number;

  @ApiProperty({ example: 2540, description: 'Cantidad de caracteres de texto extraídos' })
  textLength: number;

  @ApiProperty({ example: 'SECCION 3.2.S DROGA SUSTANCIA...', description: 'Extracto inicial del texto extraído' })
  previewText: string;

  @ApiProperty({ example: '2026-08-26T14:00:00.000Z', description: 'Fecha de creación' })
  created_at: string;
}
