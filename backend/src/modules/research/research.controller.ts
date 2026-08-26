import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResearchService } from './research.service';
import { TriggerResearchDto } from './dto/trigger-research.dto';
import { ResearchResponseDto } from './dto/research-response.dto';

@ApiTags('Research')
@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post(':moleculeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disparar agente de investigación científica sobre una molécula',
    description:
      'Consulta fuentes científicas y farmacológicas (PubChem, monografías FDA, bases regulatorias), extrae indicaciones, contraindicaciones y mecanismo de acción, y actualiza Supabase.',
  })
  @ApiParam({
    name: 'moleculeId',
    type: 'string',
    description: 'UUID de la molécula a investigar',
    example: 'f8e7d6c5-b4a3-2109-8765-43210fedcba9',
  })
  @ApiResponse({
    status: 200,
    description: 'Investigación completada y registrada exitosamente.',
    type: ResearchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'La molécula solicitada no existe.',
  })
  async triggerResearch(
    @Param('moleculeId') moleculeId: string,
    @Body() dto?: TriggerResearchDto,
  ) {
    return this.researchService.investigateMolecule(moleculeId, dto);
  }

  @Get('by-molecule/:moleculeId')
  @ApiOperation({
    summary: 'Consultar investigaciones previas de una molécula',
    description: 'Recupera el historial de fichas científicas asociadas a una molécula.',
  })
  @ApiParam({
    name: 'moleculeId',
    type: 'string',
    description: 'UUID de la molécula',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de fichas de investigación.',
    type: [ResearchResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'La molécula no existe.',
  })
  async getResearchByMolecule(@Param('moleculeId') moleculeId: string) {
    return this.researchService.getResearchByMoleculeId(moleculeId);
  }
}
