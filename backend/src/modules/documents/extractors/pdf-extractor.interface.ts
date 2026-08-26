export interface ExtractedPdfResult {
  text: string;
  numpages: number;
  info?: Record<string, any>;
  metadata?: Record<string, any>;
  version?: string;
}

export interface IPdfExtractor {
  extractText(buffer: Buffer): Promise<ExtractedPdfResult>;
}

export const PDF_EXTRACTOR_TOKEN = Symbol('IPdfExtractor');
