import { Injectable, Logger } from '@nestjs/common';
import { IPdfExtractor, ExtractedPdfResult } from './pdf-extractor.interface';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PdfParseExtractor implements IPdfExtractor {
  private readonly logger = new Logger(PdfParseExtractor.name);

  async extractText(buffer: Buffer): Promise<ExtractedPdfResult> {
    try {
      const data = await (pdfParse as any)(buffer);
      const text = data.text ? data.text.trim() : '';

      return {
        text,
        numpages: data.numpages || 1,
        info: data.info || {},
        metadata: data.metadata || {},
        version: data.version || '1.0',
      };
    } catch (error) {
      this.logger.error(`Error parsing PDF buffer: ${error.message}`, error.stack);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
}
