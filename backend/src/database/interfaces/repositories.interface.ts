import { DocumentEntity } from '../entities/document.entity';
import { MoleculeEntity } from '../entities/molecule.entity';
import { ResearchEntity } from '../entities/research.entity';

export interface IDocumentRepository {
  create(doc: Partial<DocumentEntity>): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  findAll(): Promise<DocumentEntity[]>;
  update(id: string, updateData: Partial<DocumentEntity>): Promise<DocumentEntity>;
}

export interface IMoleculeRepository {
  create(mol: Partial<MoleculeEntity>): Promise<MoleculeEntity>;
  createMany(mols: Partial<MoleculeEntity>[]): Promise<MoleculeEntity[]>;
  findById(id: string): Promise<MoleculeEntity | null>;
  findByDocumentId(documentId: string): Promise<MoleculeEntity[]>;
  update(id: string, updateData: Partial<MoleculeEntity>): Promise<MoleculeEntity>;
}

export interface IResearchRepository {
  create(res: Partial<ResearchEntity>): Promise<ResearchEntity>;
  findByMoleculeId(moleculeId: string): Promise<ResearchEntity[]>;
  findById(id: string): Promise<ResearchEntity | null>;
}
