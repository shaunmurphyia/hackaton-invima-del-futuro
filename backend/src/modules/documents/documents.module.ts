import { Module, forwardRef } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PDF_EXTRACTOR_TOKEN } from './extractors/pdf-extractor.interface';
import { PdfParseExtractor } from './extractors/pdf-parse.extractor';
import { MoleculesModule } from '../molecules/molecules.module';
import { ResearchModule } from '../research/research.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    forwardRef(() => MoleculesModule),
    forwardRef(() => ResearchModule),
    forwardRef(() => ReportsModule),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    {
      provide: PDF_EXTRACTOR_TOKEN,
      useClass: PdfParseExtractor,
    },
  ],
  exports: [DocumentsService, PDF_EXTRACTOR_TOKEN],
})
export class DocumentsModule {}
