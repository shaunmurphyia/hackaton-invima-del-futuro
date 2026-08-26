import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { RESEARCH_PROVIDER_TOKEN } from './providers/research-provider.interface';
import { PubChemResearchProvider } from './providers/pubchem-research.provider';

@Module({
  controllers: [ResearchController],
  providers: [
    ResearchService,
    {
      provide: RESEARCH_PROVIDER_TOKEN,
      useClass: PubChemResearchProvider,
    },
  ],
  exports: [ResearchService, RESEARCH_PROVIDER_TOKEN],
})
export class ResearchModule {}
