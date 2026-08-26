import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ConsolidatedDossierReportDto } from './dto/consolidated-report-response.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':documentId')
  @ApiOperation({
    summary: 'Generar reporte regulatorio consolidado del expediente (para Frontend)',
    description:
      'Retorna una estructura completa que incluye metadatos del PDF, lista de moléculas detectadas, fórmulas, CAS y todas las fichas de investigación clínica asociadas.',
  })
  @ApiParam({
    name: 'documentId',
    type: 'string',
    description: 'UUID del documento regulatorio procesado',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte regulatorio consolidado generado exitosamente.',
    type: ConsolidatedDossierReportDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Expediente no encontrado.',
  })
  async getDossierReport(@Param('documentId') documentId: string) {
    return this.reportsService.generateDossierReport(documentId);
  }
}
