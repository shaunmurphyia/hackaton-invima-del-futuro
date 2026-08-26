import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PDF_EXTRACTOR_TOKEN } from './extractors/pdf-extractor.interface';
import { PdfParseExtractor } from './extractors/pdf-parse.extractor';

@Module({
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
