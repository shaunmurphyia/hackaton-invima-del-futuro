import { Injectable, Logger } from '@nestjs/common';
import {
  DetectedMoleculeCandidate,
  IMoleculeDetector,
} from './molecule-detector.interface';

interface PharmaKnowledgeEntry {
  name: string;
  synonyms: string[];
  formula?: string;
  cas?: string;
  mw?: number;
}

@Injectable()
export class HeuristicMoleculeDetector implements IMoleculeDetector {
  private readonly logger = new Logger(HeuristicMoleculeDetector.name);

  // Catálogo farmacéutico de referencia estándar
  private readonly pharmaDatabase: PharmaKnowledgeEntry[] = [
    {
      name: 'Paracetamol',
      synonyms: ['Acetaminophen', 'Acetaminofen', 'N-(4-hydroxyphenyl)acetamide', 'Tylenol'],
      formula: 'C8H9NO2',
      cas: '103-90-2',
      mw: 151.16,
    },
    {
      name: 'Ibuprofeno',
      synonyms: ['Ibuprofen', 'Ácido 2-(4-isobutilfenil)propiónico', 'Advil', 'Motrin'],
      formula: 'C13H18O2',
      cas: '15687-27-1',
      mw: 206.28,
    },
    {
      name: 'Atorvastatina',
      synonyms: ['Atorvastatin', 'Lipitor'],
      formula: 'C33H35FN2O5',
      cas: '134523-00-5',
      mw: 558.64,
    },
    {
      name: 'Trastuzumab',
      synonyms: ['Herceptin'],
      formula: 'C6470H10012N1726O2013S42',
      cas: '180288-69-1',
      mw: 145531.5,
    },
    {
      name: 'Pembrolizumab',
      synonyms: ['Keytruda', 'MK-3475'],
      formula: 'C6504H10004N1716O2036S46',
      cas: '1374853-91-4',
      mw: 149000.0,
    },
    {
      name: 'Metformina',
      synonyms: ['Metformin', 'Glucophage', '1,1-dimethylbiguanide'],
      formula: 'C4H11N5',
      cas: '657-24-9',
      mw: 129.16,
    },
    {
      name: 'Amoxicilina',
      synonyms: ['Amoxicillin', 'Amoxil'],
      formula: 'C16H19N3O5S',
      cas: '26787-78-0',
      mw: 365.4,
    },
    {
      name: 'Remdesivir',
      synonyms: ['Veklury', 'GS-5734'],
      formula: 'C27H35N6O8P',
      cas: '1809249-37-3',
      mw: 602.6,
    },
    {
      name: 'Sofosbuvir',
      synonyms: ['Sovaldi'],
      formula: 'C22H29FN3O9P',
      cas: '1190379-70-4',
      mw: 529.45,
    },
    {
      name: 'Enalapril',
      synonyms: ['Vasotec', 'Renitec'],
      formula: 'C20H28N2O5',
      cas: '76095-16-4',
      mw: 376.45,
    },
    {
      name: 'Losartan',
      synonyms: ['Cozaar'],
      formula: 'C22H23ClN6O',
      cas: '114798-26-4',
      mw: 422.91,
    },
    {
      name: 'Omeprazol',
      synonyms: ['Omeprazole', 'Prilosec'],
      formula: 'C17H19N3O3S',
      cas: '73590-58-6',
      mw: 345.42,
    },
    {
      name: 'Aspirina',
      synonyms: ['Aspirin', 'Ácido Acetilsalicílico', 'Acetylsalicylic acid'],
      formula: 'C9H8O4',
      cas: '50-78-2',
      mw: 180.16,
    },
  ];

  // Sufijos farmacológicos estandarizados (INN / DCI)
  private readonly pharmacologicStems = [
    { suffix: /([a-z]+mab)\b/gi, type: 'Anticuerpo monoclonal' },
    { suffix: /([a-z]+nib)\b/gi, type: 'Inhibidor de tirosina quinasa' },
    { suffix: /([a-z]+statin[a]?)\b/gi, type: 'Inhibidor de HMG-CoA reductasa' },
    { suffix: /([a-z]+pril[o]?)\b/gi, type: 'Inhibidor de la ECA' },
    { suffix: /([a-z]+sartan)\b/gi, type: 'Antagonista receptor AT1' },
    { suffix: /([a-z]+olol)\b/gi, type: 'Beta-bloqueador' },
    { suffix: /([a-z]+vir)\b/gi, type: 'Antiviral' },
    { suffix: /([a-z]+cillin[a]?)\b/gi, type: 'Antibiótico Penicilínico' },
    { suffix: /([a-z]+mycin|micina)\b/gi, type: 'Antibiótico Macrólido/Aminoglucósido' },
    { suffix: /([a-z]+gliflozin[a]?)\b/gi, type: 'Inhibidor SGLT2' },
  ];

  async detect(text: string): Promise<DetectedMoleculeCandidate[]> {
    const candidatesMap = new Map<string, DetectedMoleculeCandidate>();

    if (!text || text.trim().length === 0) {
      return [];
    }

    const normalizedText = text.toLowerCase();

    // 1. Detección por Diccionario Farmacológico y Sinónimos
    for (const item of this.pharmaDatabase) {
      const matchName = new RegExp(`\\b${item.name}\\b`, 'i').test(text);
      let matchSynonym = false;

      for (const syn of item.synonyms) {
        if (new RegExp(`\\b${syn}\\b`, 'i').test(text)) {
          matchSynonym = true;
          break;
        }
      }

      if (matchName || matchSynonym) {
        candidatesMap.set(item.name.toLowerCase(), {
          name: item.name,
          formula: item.formula,
          cas_number: item.cas,
          molecular_weight: item.mw,
          confidence_score: matchName ? 0.98 : 0.92,
          detection_source: 'NAME_MATCH',
        });
      }
    }

    // 2. Detección por Números de Registro CAS (\b\d{2,7}-\d{2}-\d\b)
    const casRegex = /\b(\d{2,7}-\d{2}-\d)\b/g;
    let casMatch: RegExpExecArray | null;
    while ((casMatch = casRegex.exec(text)) !== null) {
      const cas = casMatch[1];
      const known = this.pharmaDatabase.find((p) => p.cas === cas);
      if (known) {
        candidatesMap.set(known.name.toLowerCase(), {
          name: known.name,
          formula: known.formula,
          cas_number: known.cas,
          molecular_weight: known.mw,
          confidence_score: 0.99,
          detection_source: 'CAS_REGEX',
        });
      }
    }

    // 3. Detección por Sufijos Farmacológicos (DCI / INN)
    for (const stem of this.pharmacologicStems) {
      const matches = text.match(stem.suffix);
      if (matches) {
        for (const match of matches) {
          const cleanName = match.trim();
          // Solo si tiene al menos 5 letras para evitar falsos positivos
          if (cleanName.length >= 5) {
            const key = cleanName.toLowerCase();
            if (!candidatesMap.has(key)) {
              // Capitalizar
              const formattedName =
                cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
              candidatesMap.set(key, {
                name: formattedName,
                confidence_score: 0.85,
                detection_source: 'STEM_SUFFIX',
              });
            }
          }
        }
      }
    }

    // 4. Detección por Fórmula Química (p.ej. C8H9NO2, C13H18O2, C22H29FN3O9P)
    const formulaRegex = /\b(C\d{1,3}H\d{1,3}(?:[A-Z][a-z]?\d{0,3})*)\b/g;
    let formulaMatch: RegExpExecArray | null;
    while ((formulaMatch = formulaRegex.exec(text)) !== null) {
      const formula = formulaMatch[1];
      const known = this.pharmaDatabase.find((p) => p.formula === formula);
      if (known) {
        const key = known.name.toLowerCase();
        if (!candidatesMap.has(key)) {
          candidatesMap.set(key, {
            name: known.name,
            formula: known.formula,
            cas_number: known.cas,
            molecular_weight: known.mw,
            confidence_score: 0.95,
            detection_source: 'FORMULA_REGEX',
          });
        }
      }
    }

    const results = Array.from(candidatesMap.values()).sort(
      (a, b) => b.confidence_score - a.confidence_score,
    );

    this.logger.log(`Detección completada: ${results.length} moléculas identificadas.`);
    return results;
  }
}
