/**
 * ==============================================================================
 * CONTRATOS E INTERFACES PARA LA ARQUITECTURA MULTI-AGENTE Y PROVEEDORES EXTERNOS
 * ==============================================================================
 * Diseñado bajo Clean Architecture & Hexagonal Ports & Adapters para permitir
 * la incorporación de agentes autónomos y APIs científicas sin acoplar la lógica.
 */

// 1. Contexto de ejecución del agente
export interface AgentExecutionContext {
  agentId: string;
  traceId: string;
  sessionContext?: Record<string, any>;
  timestamp: string;
}

// 2. Resultado estándar producido por un Agente
export interface AgentExecutionResult<T = any> {
  success: boolean;
  agentName: string;
  confidenceScore: number;
  data: T;
  logs: string[];
  executionTimeMs: number;
}

// 3. Contrato base de Agente Autónomo
export interface IAutonomousAgent<TInput = any, TOutput = any> {
  readonly agentName: string;
  readonly agentRole: string;
  execute(input: TInput, ctx?: AgentExecutionContext): Promise<AgentExecutionResult<TOutput>>;
}

// 4. Puertos específicos de Agentes Especializados
export interface IDocumentAgent extends IAutonomousAgent<{ fileBuffer: Buffer; filename: string }, any> {}
export interface IExtractionAgent extends IAutonomousAgent<{ rawText: string; section?: string }, any> {}
export interface IMoleculeAgent extends IAutonomousAgent<{ text: string; documentId?: string }, any> {}
export interface IResearchAgent extends IAutonomousAgent<{ moleculeName: string; cas?: string }, any> {}
export interface IValidationAgent extends IAutonomousAgent<{ moleculeData: any; regulatoryRegion: 'FDA' | 'EMA' | 'INVIMA' }, any> {}
export interface ISummaryAgent extends IAutonomousAgent<{ fullDossierData: any }, any> {}
export interface IReportAgent extends IAutonomousAgent<{ dossierId: string }, any> {}

// 5. Puertos para Proveedores Científicos y LLMs Externos
export interface IPubChemAdapter {
  fetchCompoundByCid(cid: number): Promise<any>;
  fetchCompoundByName(name: string): Promise<any>;
}

export interface IPubMedAdapter {
  searchArticles(query: string, maxResults?: number): Promise<any[]>;
  fetchArticleAbstract(pmid: string): Promise<string>;
}

export interface IFdaRegulatoryAdapter {
  fetchDrugLabels(genericName: string): Promise<any>;
  fetchAdverseEvents(substance: string): Promise<any>;
}

export interface IInvimaRegulatoryAdapter {
  fetchRegistroSanitario(principioActivo: string): Promise<any>;
}

export interface IDrugBankAdapter {
  fetchDrugInteractions(drugBankId: string): Promise<any>;
  fetchTargetProteins(drugBankId: string): Promise<any>;
}

export interface IChemSpiderAdapter {
  searchByStructure(smiles: string): Promise<any>;
}

export interface ILlmModelAdapter {
  generateCompletion(prompt: string, options?: { temperature?: number; model?: string }): Promise<string>;
  generateStructuredJson<T>(prompt: string, schema: any): Promise<T>;
}
