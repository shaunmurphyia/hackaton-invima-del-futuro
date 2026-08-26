import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ExtractMoleculesDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID del documento previamente cargado (opcional si se pasa text)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiProperty({
    example: 'El expediente describe la formulación de Paracetamol 500mg (CAS 103-90-2) con fórmula C8H9NO2 y Atorvastatina.',
    description: 'Texto arbitrario para analizar y extraer moléculas (opcional si se pasa documentId)',
    required: false,
  })
  @IsOptional()
  @IsString()
  text?: string;
}
