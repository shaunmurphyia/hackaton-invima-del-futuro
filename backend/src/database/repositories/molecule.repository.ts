import { Injectable, Logger } from '@nestjs/common';
import { IMoleculeRepository } from '../interfaces/repositories.interface';
import { MoleculeEntity, MoleculeStatus } from '../entities/molecule.entity';
import { SupabaseService } from '../supabase.service';
import { randomUUID } from 'crypto';

@Injectable()
export class MoleculeRepository implements IMoleculeRepository {
  private readonly logger = new Logger(MoleculeRepository.name);
  private memoryStore: Map<string, MoleculeEntity> = new Map();

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(mol: Partial<MoleculeEntity>): Promise<MoleculeEntity> {
    const newMol: MoleculeEntity = {
      id: mol.id || randomUUID(),
      document_id: mol.document_id,
      name: mol.name,
      formula: mol.formula || undefined,
      cas_number: mol.cas_number || undefined,
      molecular_weight: mol.molecular_weight || undefined,
      confidence_score: mol.confidence_score ?? 1.0,
      status: mol.status || MoleculeStatus.DETECTED,
      created_at: new Date().toISOString(),
    };

    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('molecules')
          .insert({
            id: newMol.id,
            document_id: newMol.document_id,
            name: newMol.name,
            formula: newMol.formula,
            cas_number: newMol.cas_number,
            molecular_weight: newMol.molecular_weight,
            confidence_score: newMol.confidence_score,
            status: newMol.status,
          })
          .select()
          .single();

        if (!error && data) {
          return data as MoleculeEntity;
        }
        this.logger.warn(`Supabase insert molecule failed: ${error?.message}`);
      } catch (err) {
        this.logger.warn(`Supabase molecule error: ${err.message}`);
      }
    }

    this.memoryStore.set(newMol.id, newMol);
    return newMol;
  }

  async createMany(mols: Partial<MoleculeEntity>[]): Promise<MoleculeEntity[]> {
    const results: MoleculeEntity[] = [];
    for (const mol of mols) {
      const saved = await this.create(mol);
      results.push(saved);
    }
    return results;
  }

  async findById(id: string): Promise<MoleculeEntity | null> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('molecules')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data as MoleculeEntity;
        }
      } catch (err) {
        this.logger.warn(`Supabase find molecule by id error: ${err.message}`);
      }
    }

    return this.memoryStore.get(id) || null;
  }

  async findByDocumentId(documentId: string): Promise<MoleculeEntity[]> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('molecules')
          .select('*')
          .eq('document_id', documentId)
          .order('confidence_score', { ascending: false });

        if (!error && data) {
          return data as MoleculeEntity[];
        }
      } catch (err) {
        this.logger.warn(`Supabase find molecules by doc error: ${err.message}`);
      }
    }

    return Array.from(this.memoryStore.values()).filter(
      (m) => m.document_id === documentId,
    );
  }

  async update(id: string, updateData: Partial<MoleculeEntity>): Promise<MoleculeEntity> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('molecules')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as MoleculeEntity;
        }
      } catch (err) {
        this.logger.warn(`Supabase molecule update error: ${err.message}`);
      }
    }

    const existing = this.memoryStore.get(id);
    if (!existing) {
      throw new Error(`Molecule with ID ${id} not found.`);
    }

    const updated = { ...existing, ...updateData };
    this.memoryStore.set(id, updated);
    return updated;
  }
}
