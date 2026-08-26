export interface DetectedMoleculeCandidate {
  name: string;
  formula?: string;
  cas_number?: string;
  molecular_weight?: number;
  confidence_score: number;
  detection_source: 'NAME_MATCH' | 'CAS_REGEX' | 'FORMULA_REGEX' | 'STEM_SUFFIX' | 'AI_AGENT';
}

export interface IMoleculeDetector {
  detect(text: string): Promise<DetectedMoleculeCandidate[]>;
}

export const MOLECULE_DETECTOR_TOKEN = Symbol('IMoleculeDetector');
