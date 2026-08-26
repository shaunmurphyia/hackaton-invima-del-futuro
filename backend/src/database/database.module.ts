import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { DocumentRepository } from './repositories/document.repository';
import { MoleculeRepository } from './repositories/molecule.repository';
import { ResearchRepository } from './repositories/research.repository';

@Global()
@Module({
  providers: [
    SupabaseService,
    DocumentRepository,
    MoleculeRepository,
    ResearchRepository,
  ],
  exports: [
    SupabaseService,
    DocumentRepository,
    MoleculeRepository,
    ResearchRepository,
  ],
})
export class DatabaseModule {}
