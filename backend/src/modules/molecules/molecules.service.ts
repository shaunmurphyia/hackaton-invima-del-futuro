import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IMoleculeDetector,
  MOLECULE_DETECTOR_TOKEN,
} from './detectors/molecule-detector.interface';
import { MoleculeRepository } from '../../database/repositories/molecule.repository';
import { DocumentRepository } from '../../database/repositories/document.repository';
import { ExtractMoleculesDto } from './dto/extract-molecules.dto';
import { MoleculeEntity, MoleculeStatus } from '../../database/entities/molecule.entity';

@Injectable()
export class MoleculesService {
  private readonly logger = new Logger(MoleculesService.name);

  constructor(
    @Inject(MOLECULE_DETECTOR_TOKEN)
    private readonly moleculeDetector: IMoleculeDetector,
    private readonly moleculeRepository: MoleculeRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async extractAndSave(dto: ExtractMoleculesDto): Promise<{ count: number; molecules: MoleculeEntity[] }> {
    let textToAnalyze = '';
    let targetDocId = dto.documentId;

    if (dto.documentId) {
      const doc = await this.documentRepository.findById(dto.documentId);
      if (!doc) {
        throw new NotFoundException(`Documento con ID ${dto.documentId} no encontrado.`);
      }
      textToAnalyze = doc.raw_text || '';
    } else if (dto.text) {
      textToAnalyze = dto.text;
    } else {
      throw new BadRequestException('Debe proporcionar un documentId o un texto para analizar.');
    }

    if (!textToAnalyze.trim()) {
      return { count: 0, molecules: [] };
    }

    this.logger.log(`Analizando texto para detección de moléculas (${textToAnalyze.length} caracteres)...`);
    const candidates = await this.moleculeDetector.detect(textToAnalyze);

    const savedMolecules: MoleculeEntity[] = [];

    for (const candidate of candidates) {
      const saved = await this.moleculeRepository.create({
        document_id: targetDocId,
        name: candidate.name,
        formula: candidate.formula,
        cas_number: candidate.cas_number,
        molecular_weight: candidate.molecular_weight,
        confidence_score: candidate.confidence_score,
        status: MoleculeStatus.DETECTED,
      });
      savedMolecules.push(saved);
    }

    return {
      count: savedMolecules.length,
      molecules: savedMolecules,
    };
  }

  async getMoleculeById(id: string): Promise<MoleculeEntity> {
    const mol = await this.moleculeRepository.findById(id);
    if (!mol) {
      throw new NotFoundException(`Molécula con ID ${id} no encontrada.`);
    }
    return mol;
  }

  async getMoleculesByDocumentId(documentId: string): Promise<MoleculeEntity[]> {
    return this.moleculeRepository.findByDocumentId(documentId);
  }
}
