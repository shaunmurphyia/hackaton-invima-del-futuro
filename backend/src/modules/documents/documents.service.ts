import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IPdfExtractor,
  PDF_EXTRACTOR_TOKEN,
} from './extractors/pdf-extractor.interface';
import { DocumentRepository } from '../../database/repositories/document.repository';
import { DocumentEntity, DocumentStatus } from '../../database/entities/document.entity';
import { UploadDocumentResponseDto } from './dto/upload-document-response.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @Inject(PDF_EXTRACTOR_TOKEN)
    private readonly pdfExtractor: IPdfExtractor,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async processAndUploadPdf(file: Express.Multer.File): Promise<UploadDocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo.');
    }

    if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Formato de archivo no válido. Solo se admiten expedientes en formato PDF.');
    }

    this.logger.log(`Iniciando extracción de texto para expediente: ${file.originalname} (${file.size} bytes)`);

    const extracted = await this.pdfExtractor.extractText(file.buffer);

    const previewText = extracted.text.length > 300
      ? extracted.text.slice(0, 300) + '...'
      : extracted.text;

    const savedDoc = await this.documentRepository.create({
      filename: file.originalname,
      mime_type: file.mimetype || 'application/pdf',
      file_size_bytes: file.size,
      raw_text: extracted.text,
      summary: `Expediente regulatorio con ${extracted.numpages} páginas. Caracteres extraídos: ${extracted.text.length}.`,
      status: DocumentStatus.PROCESSED,
      metadata: {
        totalPages: extracted.numpages,
        version: extracted.version,
        info: extracted.info,
      },
    });

    this.logger.log(`Documento guardado con éxito. ID: ${savedDoc.id}`);

    return {
      id: savedDoc.id,
      filename: savedDoc.filename,
      file_size_bytes: savedDoc.file_size_bytes,
      status: savedDoc.status,
      totalPages: extracted.numpages,
      textLength: extracted.text.length,
      previewText,
      created_at: savedDoc.created_at,
    };
  }

  async getDocumentById(id: string): Promise<DocumentEntity> {
    const doc = await this.documentRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Expediente con ID ${id} no encontrado.`);
    }
    return doc;
  }

  async getAllDocuments(): Promise<DocumentEntity[]> {
    return this.documentRepository.findAll();
  }
}
