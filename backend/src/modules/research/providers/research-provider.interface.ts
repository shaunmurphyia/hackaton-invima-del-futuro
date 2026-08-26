export interface ScientificResearchResult {
  provider: string;
  formula?: string;
  cas_number?: string;
  molecular_weight?: number;
  iupac_name?: string;
  summary: string;
  indications: string[];
  contraindications: string[];
  raw_data: Record<string, any>;
}

export interface IResearchProvider {
  investigateMolecule(moleculeName: string): Promise<ScientificResearchResult>;
}

export const RESEARCH_PROVIDER_TOKEN = Symbol('IResearchProvider');
