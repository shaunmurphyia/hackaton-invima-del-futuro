import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  IPdfExtractor,
  PDF_EXTRACTOR_TOKEN,
} from './extractors/pdf-extractor.interface';
import { DocumentRepository } from '../../database/repositories/document.repository';
import { DocumentEntity, DocumentStatus } from '../../database/entities/document.entity';
import { UploadDocumentResponseDto } from './dto/upload-document-response.dto';
import { MoleculesService } from '../molecules/molecules.service';
import { ResearchService } from '../research/research.service';
import { ReportsService } from '../reports/reports.service';
import { ConsolidatedDossierReportDto } from '../reports/dto/consolidated-report-response.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @Inject(PDF_EXTRACTOR_TOKEN)
    private readonly pdfExtractor: IPdfExtractor,
    private readonly documentRepository: DocumentRepository,
    @Inject(forwardRef(() => MoleculesService))
    private readonly moleculesService: MoleculesService,
    @Inject(forwardRef(() => ResearchService))
    private readonly researchService: ResearchService,
    @Inject(forwardRef(() => ReportsService))
    private readonly reportsService: ReportsService,
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

  /**
   * Pipeline End-to-End en 1 sola llamada (One-Click Analysis para Frontend)
   */
  async processFullPipeline(file: Express.Multer.File): Promise<ConsolidatedDossierReportDto> {
    this.logger.log(`⚡ Ejecutando Pipeline completo 1-Click para expediente: ${file?.originalname}`);

    // 1. Subir y extraer texto de PDF
    const uploadResult = await this.processAndUploadPdf(file);

    // 2. Detectar y extraer moléculas
    const extractionResult = await this.moleculesService.extractAndSave({
      documentId: uploadResult.id,
    });

    // 3. Investigar automáticamente cada molécula identificada
    for (const mol of extractionResult.molecules) {
      try {
        await this.researchService.investigateMolecule(mol.id);
      } catch (err) {
        this.logger.warn(`Error en investigación de molécula ${mol.name}: ${err.message}`);
      }
    }

    // 4. Generar reporte consolidado con auditoría INVIMA
    return this.reportsService.generateDossierReport(uploadResult.id);
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
