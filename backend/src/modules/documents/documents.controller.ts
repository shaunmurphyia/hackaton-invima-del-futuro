import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { UploadDocumentResponseDto } from './dto/upload-document-response.dto';
import { DocumentResponseDto } from './dto/document-response.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir y procesar expediente PDF (CTD/eCTD)',
    description:
      'Recibe un archivo PDF regulatorio, extrae el texto completo, computa metadatos y lo persiste en la base de datos.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF del expediente CTD / eCTD a procesar',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento procesado y registrado exitosamente.',
    type: UploadDocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo faltante o formato incompatible (debe ser PDF).',
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadDocumentResponseDto> {
    return this.documentsService.processAndUploadPdf(file);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los expedientes procesados',
    description: 'Devuelve la lista histórica de documentos procesados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de expedientes.',
    type: [DocumentResponseDto],
  })
  async getAllDocuments() {
    return this.documentsService.getAllDocuments();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle completo de un expediente por ID',
    description: 'Recupera el texto extraído, metadatos y estado del expediente.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'UUID del documento',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del expediente.',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Documento no encontrado.',
  })
  async getDocumentById(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id);
  }
}
