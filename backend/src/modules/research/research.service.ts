import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IResearchProvider,
  RESEARCH_PROVIDER_TOKEN,
} from './providers/research-provider.interface';
import { MoleculeRepository } from '../../database/repositories/molecule.repository';
import { ResearchRepository } from '../../database/repositories/research.repository';
import { TriggerResearchDto } from './dto/trigger-research.dto';
import { ResearchEntity } from '../../database/entities/research.entity';
import { MoleculeEntity, MoleculeStatus } from '../../database/entities/molecule.entity';

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  constructor(
    @Inject(RESEARCH_PROVIDER_TOKEN)
    private readonly researchProvider: IResearchProvider,
    private readonly moleculeRepository: MoleculeRepository,
    private readonly researchRepository: ResearchRepository,
  ) {}

  async investigateMolecule(
    moleculeIdOrName: string,
    dto?: TriggerResearchDto,
  ): Promise<ResearchEntity> {
    let molecule: MoleculeEntity | null = null;

    // 1. Intentar buscar por UUID
    molecule = await this.moleculeRepository.findById(moleculeIdOrName);

    // 2. Si no se encuentra por UUID, permitir búsqueda o creación rápida por Nombre de Molécula
    if (!molecule) {
      // Si parece un nombre de molécula (no solo un UUID fallido) o si se desea investigar directamente por nombre
      this.logger.log(`Molécula no encontrada por ID directo. Creando registro dinámico para "${moleculeIdOrName}"...`);
      molecule = await this.moleculeRepository.create({
        name: moleculeIdOrName,
        confidence_score: 1.0,
        status: MoleculeStatus.DETECTED,
      });
    }

    this.logger.log(
      `Iniciando agente de investigación para molécula "${molecule.name}" (ID: ${molecule.id})...`,
    );

    // Actualizar estado intermedio
    await this.moleculeRepository.update(molecule.id, {
      status: MoleculeStatus.RESEARCHING,
    });

    // Ejecutar investigación científica a través del proveedor/agente
    const result = await this.researchProvider.investigateMolecule(molecule.name);

    // Enriquecer la molécula si descubrimos datos complementarios
    const moleculeUpdates: Record<string, any> = {
      status: MoleculeStatus.RESEARCHED,
    };
    if (!molecule.formula && result.formula) {
      moleculeUpdates.formula = result.formula;
    }
    if (!molecule.cas_number && result.cas_number) {
      moleculeUpdates.cas_number = result.cas_number;
    }
    if (!molecule.molecular_weight && result.molecular_weight) {
      moleculeUpdates.molecular_weight = result.molecular_weight;
    }

    await this.moleculeRepository.update(molecule.id, moleculeUpdates);

    // Persistir hallazgos científicos en la tabla research
    const savedResearch = await this.researchRepository.create({
      molecule_id: molecule.id,
      provider: dto?.preferredProvider || result.provider,
      summary: result.summary,
      indications: result.indications,
      contraindications: result.contraindications,
      raw_data: result.raw_data,
    });

    this.logger.log(
      `Investigación completada y guardada para "${molecule.name}". Research ID: ${savedResearch.id}`,
    );

    return savedResearch;
  }

  async getResearchByMoleculeId(moleculeId: string): Promise<ResearchEntity[]> {
    const molecule = await this.moleculeRepository.findById(moleculeId);
    if (!molecule) {
      throw new NotFoundException(`Molécula con ID ${moleculeId} no encontrada.`);
    }
    return this.researchRepository.findByMoleculeId(moleculeId);
  }
}
