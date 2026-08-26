import { Injectable, Logger } from '@nestjs/common';
import { IDocumentRepository } from '../interfaces/repositories.interface';
import { DocumentEntity, DocumentStatus } from '../entities/document.entity';
import { SupabaseService } from '../supabase.service';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  private readonly logger = new Logger(DocumentRepository.name);
  private memoryStore: Map<string, DocumentEntity> = new Map();

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(doc: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const newDoc: DocumentEntity = {
      id: doc.id || randomUUID(),
      filename: doc.filename || 'unknown.pdf',
      mime_type: doc.mime_type || 'application/pdf',
      file_size_bytes: doc.file_size_bytes || 0,
      raw_text: doc.raw_text || '',
      summary: doc.summary || '',
      status: doc.status || DocumentStatus.PROCESSED,
      metadata: doc.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      try {
        const { data, error } = await client
          .from('documents')
          .insert({
            id: newDoc.id,
            filename: newDoc.filename,
            mime_type: newDoc.mime_type,
            file_size_bytes: newDoc.file_size_bytes,
            raw_text: newDoc.raw_text,
            summary: newDoc.summary,
            status: newDoc.status,
            metadata: newDoc.metadata,
          })
          .select()
          .single();

        if (error) {
          this.logger.warn(`Supabase insert failed: ${error.message}. Saving to memory store.`);
          this.memoryStore.set(newDoc.id, newDoc);
          return newDoc;
        }

        return data as DocumentEntity;
      } catch (err) {
        this.logger.warn(`Supabase operation threw error: ${err.message}. Falling back to memory.`);
      }
    }

    this.memoryStore.set(newDoc.id, newDoc);
    return newDoc;
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('documents')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data as DocumentEntity;
        }
      } catch (err) {
        this.logger.warn(`Supabase findById error: ${err.message}. Checking memory.`);
      }
    }

    return this.memoryStore.get(id) || null;
  }

  async findAll(): Promise<DocumentEntity[]> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as DocumentEntity[];
        }
      } catch (err) {
        this.logger.warn(`Supabase findAll error: ${err.message}. Returning memory store.`);
      }
    }

    return Array.from(this.memoryStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  async update(id: string, updateData: Partial<DocumentEntity>): Promise<DocumentEntity> {
    if (this.supabaseService.isReady()) {
      try {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('documents')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as DocumentEntity;
        }
      } catch (err) {
        this.logger.warn(`Supabase update error: ${err.message}`);
      }
    }

    const existing = this.memoryStore.get(id);
    if (!existing) {
      throw new Error(`Document with ID ${id} not found.`);
    }

    const updated = {
      ...existing,
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    this.memoryStore.set(id, updated);
    return updated;
  }
}
