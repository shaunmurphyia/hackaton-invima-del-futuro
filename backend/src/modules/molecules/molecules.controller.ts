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
import { MoleculesService } from './molecules.service';
import { ExtractMoleculesDto } from './dto/extract-molecules.dto';
import {
  ExtractMoleculesResponseDto,
  MoleculeResponseDto,
} from './dto/molecule-response.dto';

@ApiTags('Molecules')
@Controller('molecules')
export class MoleculesController {
  constructor(private readonly moleculesService: MoleculesService) {}

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detectar y extraer moléculas de un expediente o texto libre',
    description:
      'Ejecuta el motor de reconocimiento farmacológico para identificar principios activos, fórmulas químicas, CAS y sufijos regulatorios (DCI), persistiendo los resultados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Moléculas identificadas y persistidas exitosamente.',
    type: ExtractMoleculesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud inválida (falta documentId o text).',
  })
  @ApiResponse({
    status: 404,
    description: 'El documentId proporcionado no existe.',
  })
  async extractMolecules(@Body() dto: ExtractMoleculesDto) {
    return this.moleculesService.extractAndSave(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de una molécula por su ID',
    description: 'Recupera información técnica de una molécula almacenada.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'UUID de la molécula',
    example: 'f8e7d6c5-b4a3-2109-8765-43210fedcba9',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la molécula.',
    type: MoleculeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Molécula no encontrada.',
  })
  async getMoleculeById(@Param('id') id: string) {
    return this.moleculesService.getMoleculeById(id);
  }

  @Get('by-document/:documentId')
  @ApiOperation({
    summary: 'Listar todas las moléculas detectadas en un expediente',
    description: 'Devuelve todas las moléculas asociadas a un documento específico.',
  })
  @ApiParam({
    name: 'documentId',
    type: 'string',
    description: 'UUID del documento',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de moléculas vinculadas.',
    type: [MoleculeResponseDto],
  })
  async getMoleculesByDocumentId(@Param('documentId') documentId: string) {
    return this.moleculesService.getMoleculesByDocumentId(documentId);
  }
}
