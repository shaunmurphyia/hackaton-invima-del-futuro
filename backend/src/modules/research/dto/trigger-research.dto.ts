import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TriggerResearchDto {
  @ApiProperty({
    example: 'PubChem',
    description: 'Proveedor o agente científico preferido (PubChem, FDA, Gemini, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferredProvider?: string;
}
