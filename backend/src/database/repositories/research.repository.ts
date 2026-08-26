import { Injectable, Logger } from '@nestjs/common';
import { IResearchRepository } from '../interfaces/repositories.interface';
import { ResearchEntity } from '../entities/research.entity';
import { SupabaseService } from '../supabase.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ResearchRepository implements IResearchRepository {
  private readonly logger = new Logger(ResearchRepository.name);
  private memoryStore: Map<string, ResearchEntity> = new Map();

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(res: Partial<ResearchEntity>): Promise<ResearchEntity> {
    const newRes: ResearchEntity = {
      id: res.id || randomUUID(),
      molecule_id: res.molecule_id,
      provider: res.provider || 'PubChem',
      raw_data: res.raw_data || {},
      summary: res.summary || '',
      indications: res.indications || [],
      contraindications: res.contraindications || [],
      created_at: new Date().toISOString(),
    };

    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('research')
          .insert({
            id: newRes.id,
            molecule_id: newRes.molecule_id,
            provider: newRes.provider,
            raw_data: newRes.raw_data,
            summary: newRes.summary,
            indications: newRes.indications,
            contraindications: newRes.contraindications,
          })
          .select()
          .single();

        if (!error && data) {
          return data as ResearchEntity;
        }
        this.logger.warn(`Supabase insert research failed: ${error?.message}`);
      } catch (err) {
        this.logger.warn(`Supabase research error: ${err.message}`);
      }
    }

    this.memoryStore.set(newRes.id, newRes);
    return newRes;
  }

  async findByMoleculeId(moleculeId: string): Promise<ResearchEntity[]> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('research')
          .select('*')
          .eq('molecule_id', moleculeId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as ResearchEntity[];
        }
      } catch (err) {
        this.logger.warn(`Supabase find research by mol error: ${err.message}`);
      }
    }

    return Array.from(this.memoryStore.values()).filter(
      (r) => r.molecule_id === moleculeId,
    );
  }

  async findById(id: string): Promise<ResearchEntity | null> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('research')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data as ResearchEntity;
        }
      } catch (err) {
        this.logger.warn(`Supabase find research by id error: ${err.message}`);
      }
    }

    return this.memoryStore.get(id) || null;
  }
}
