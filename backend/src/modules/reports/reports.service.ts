import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DocumentRepository } from '../../database/repositories/document.repository';
import { MoleculeRepository } from '../../database/repositories/molecule.repository';
import { ResearchRepository } from '../../database/repositories/research.repository';
import {
  ConsolidatedDossierReportDto,
  EnrichedMoleculeReportDto,
} from './dto/consolidated-report-response.dto';
import { MoleculeStatus } from '../../database/entities/molecule.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly moleculeRepository: MoleculeRepository,
    private readonly researchRepository: ResearchRepository,
  ) {}

  async generateDossierReport(documentId: string): Promise<ConsolidatedDossierReportDto> {
    this.logger.log(`Generando reporte consolidado para expediente: ${documentId}`);

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException(`Expediente con ID ${documentId} no encontrado.`);
    }

    const molecules = await this.moleculeRepository.findByDocumentId(documentId);

    const enrichedMolecules: EnrichedMoleculeReportDto[] = [];
    let researchedCount = 0;

    for (const mol of molecules) {
      const researchFindings = await this.researchRepository.findByMoleculeId(mol.id);
      if (researchFindings.length > 0 || mol.status === MoleculeStatus.RESEARCHED) {
        researchedCount++;
      }

      enrichedMolecules.push({
        ...mol,
        researchFindings,
      });
    }

    const moleculeNames = molecules.map((m) => m.name).join(', ');
    const executiveSummary = molecules.length > 0
      ? `Expediente regulatorio "${document.filename}" analizado exitosamente. Se identificaron ${molecules.length} molécula(s) activa(s) (${moleculeNames}). Investigaciones científicas y regulatorias consolidadas: ${researchedCount}/${molecules.length}.`
      : `Expediente regulatorio "${document.filename}" analizado. No se detectaron moléculas activas concluyentes en la muestra analizada.`;

    return {
      document,
      totalMolecules: molecules.length,
      researchedMoleculesCount: researchedCount,
      molecules: enrichedMolecules,
      executiveSummary,
      generatedAt: new Date().toISOString(),
    };
  }
}
