import { Injectable, Logger } from '@nestjs/common';
import { MoleculeEntity } from '../../../database/entities/molecule.entity';
import { DocumentEntity } from '../../../database/entities/document.entity';
import {
  InvimaCheckItem,
  InvimaComplianceResultDto,
} from '../dto/invima-compliance.dto';

@Injectable()
export class InvimaComplianceService {
  private readonly logger = new Logger(InvimaComplianceService.name);

  evaluateCompliance(
    document: DocumentEntity,
    molecules: MoleculeEntity[],
  ): InvimaComplianceResultDto {
    this.logger.log(`Evaluando conformidad regulatoria INVIMA para expediente: ${document.filename}`);

    const rawText = (document.raw_text || '').toLowerCase();

    // 1. Determinar categoría del producto
    const isBiological = molecules.some(
      (m) =>
        m.name.toLowerCase().endsWith('mab') ||
        (m.molecular_weight && m.molecular_weight > 5000) ||
        rawText.includes('anticuerpo monoclonal') ||
        rawText.includes('proteína recombinante'),
    );

    const productCategory = isBiological
      ? 'MEDICAMENTO BIOLÓGICO / BIOTECNOLÓGICO'
      : 'SÍNTESIS QUÍMICA';

    const applicableRegulations = isBiological
      ? [
          'Decreto 1782 de 2014 (Evaluación de medicamentos biológicos)',
          'Decreto 677 de 1995 (Régimen de registros y licencias sanitarias)',
          'Resolución 3690 de 2016 (Guías de comparabilidad biológica)',
        ]
      : [
          'Decreto 677 de 1995 (Régimen de registros sanitarios de medicamentos)',
          'Resolución 1124 de 2016 (Guía de Biodisponibilidad y Bioequivalencia)',
          'Resolución 3158 de 2007 (Estudios de Estabilidad para Colombia)',
        ];

    // 2. Ejecutar Checklist de Auditoría
    const checkpoints: InvimaCheckItem[] = [];

    // Checkpoint A: Estructura CTD Módulo 3 (Calidad Sustancia y Producto)
    const hasSection32S =
      rawText.includes('3.2.s') ||
      rawText.includes('sustancia') ||
      rawText.includes('droga sustancia') ||
      rawText.includes('active substance');
    const hasSection32P =
      rawText.includes('3.2.p') ||
      rawText.includes('producto terminado') ||
      rawText.includes('formulación') ||
      rawText.includes('drug product');

    checkpoints.push({
      code: 'INV-CTD-01',
      requirement: 'Estructura CTD Módulo 3 (3.2.S Sustancia Activa y 3.2.P Producto Terminado)',
      category: 'QUALITY_CTD_M3',
      status: hasSection32S && hasSection32P ? 'COMPLIANT' : hasSection32S || hasSection32P ? 'WARNING' : 'ACTION_REQUIRED',
      details: hasSection32S && hasSection32P
        ? 'El expediente contiene secciones identificables de caracterización de sustancia activa y producto terminado.'
        : 'Se sugiere verificar la inclusión explícita de las secciones 3.2.S y 3.2.P bajo formato ICH CTD.',
      regulationReference: 'Guía Técnica CTD INVIMA / ICH M4Q',
    });

    // Checkpoint B: Estudios de Estabilidad en Zona Climática IVB
    const hasStability = rawText.includes('estabilidad') || rawText.includes('stability');
    const hasZoneIVB =
      rawText.includes('ivb') ||
      rawText.includes('iv-b') ||
      rawText.includes('30°c') ||
      rawText.includes('30 °c') ||
      rawText.includes('75%');

    checkpoints.push({
      code: 'INV-ESTAB-02',
      requirement: 'Estudios de Estabilidad en Zona Climática IVB (30°C ± 2°C / 75% HR ± 5% HR)',
      category: 'STABILITY_ZONA_IVB',
      status: hasZoneIVB ? 'COMPLIANT' : hasStability ? 'WARNING' : 'ACTION_REQUIRED',
      details: hasZoneIVB
        ? 'Se detectan referencias a condiciones climáticas de Zona IVB requeridas para Colombia.'
        : hasStability
        ? 'Se mencionan estudios de estabilidad, pero debe confirmarse cumplimiento estricto con Zona IVB (30°C / 75% HR).'
        : 'Requisito crítico: Se debe adjuntar protocolo y reporte de estabilidad en Zona IVB a largo plazo y acelerada.',
      regulationReference: 'Resolución 3158 de 2007 (INVIMA)',
    });

    // Checkpoint C: Caracterización y Control de Impurezas
    const hasImpurityControl =
      rawText.includes('impureza') ||
      rawText.includes('impurity') ||
      rawText.includes('productos de degradación') ||
      rawText.includes('hplc');

    checkpoints.push({
      code: 'INV-IMP-03',
      requirement: 'Control de Impurezas Orgánicas, Inorgánicas y Solventes Residuales',
      category: 'QUALITY_CTD_M3',
      status: hasImpurityControl ? 'COMPLIANT' : 'WARNING',
      details: hasImpurityControl
        ? 'Información analítica sobre especificaciones de impurezas y métodos de ensayo presente.'
        : 'Verificar perfiles de degradación y límites de impurezas según ICH Q3A/Q3B.',
      regulationReference: 'ICH Q3A / Q3B / Farmacopea Oficial (USP/Ph. Eur.)',
    });

    // Checkpoint D: Requisitos de Bioequivalencia (si aplica para Síntesis)
    const requiresBioequivalence = !isBiological && molecules.length > 0;
    const mentionsBE =
      rawText.includes('bioequivalencia') ||
      rawText.includes('biodisponibilidad') ||
      rawText.includes('perfil de disolución') ||
      rawText.includes('f2');

    if (requiresBioequivalence) {
      checkpoints.push({
        code: 'INV-BE-04',
        requirement: 'Estudios de Bioequivalencia / Perfiles de Disolución Comparativa',
        category: 'BIOEQUIVALENCE',
        status: mentionsBE ? 'COMPLIANT' : 'WARNING',
        details: mentionsBE
          ? 'Evidencia de perfiles de disolución o estudios de bioequivalencia identificada.'
          : 'Consultar listado oficial de medicamentos que requieren Bioequivalencia según Resolución 1124 de 2016.',
        regulationReference: 'Resolución 1124 de 2016 (INVIMA)',
      });
    }

    // Checkpoint E: Certificado de Buenas Prácticas de Manufactura (BPM / GMP)
    const hasBpm = rawText.includes('bpm') || rawText.includes('gmp') || rawText.includes('buenas prácticas');
    checkpoints.push({
      code: 'INV-BPM-05',
      requirement: 'Certificado de Buenas Prácticas de Manufactura (BPM / GMP) vigente',
      category: 'LEGAL',
      status: hasBpm ? 'COMPLIANT' : 'WARNING',
      details: hasBpm
        ? 'Referencia documental a certificación BPM del fabricante.'
        : 'Asegurar certificado BPM vigente emitido o convalidado por INVIMA para el sitio de fabricación.',
      regulationReference: 'Decreto 677 de 1995 / Decreto 549 de 2001',
    });

    // 3. Calcular Score Ponderado
    const scoreMap = { COMPLIANT: 100, WARNING: 70, ACTION_REQUIRED: 30 };
    const totalScore = Math.round(
      checkpoints.reduce((acc, curr) => acc + scoreMap[curr.status], 0) / checkpoints.length,
    );

    let status: 'CONFORME' | 'EVALUADO_APTO_CON_OBSERVACIONES' | 'REQUIERE_SUBSANACION' | 'NO_CONFORME';
    if (totalScore >= 85) {
      status = 'CONFORME';
    } else if (totalScore >= 70) {
      status = 'EVALUADO_APTO_CON_OBSERVACIONES';
    } else if (totalScore >= 50) {
      status = 'REQUIERE_SUBSANACION';
    } else {
      status = 'NO_CONFORME';
    }

    // 4. Recomendaciones Regulatorias
    const recommendations: string[] = [
      'Presentar el dossier consolidado en idioma español ante la Sala Especializada de Medicamentos de INVIMA.',
      'Asegurar que los estudios de estabilidad incluyan los lotes piloto/industriales bajo la Zona Climática IVB.',
    ];

    if (isBiological) {
      recommendations.push(
        'Presentar Plan de Gestión de Riesgo (PGR) y estudios preclínicos/clínicos de comparabilidad según Decreto 1782 de 2014.',
      );
    } else {
      recommendations.push(
        'Verificar si el principio activo requiere presentar prueba in vivo de Bioequivalencia o si califica para bioexención BCS.',
      );
    }

    return {
      score: totalScore,
      status,
      productCategory,
      applicableRegulations,
      stabilityZoneRequirement: 'Zona Climática IVB (30°C ± 2°C / 75% HR ± 5% HR)',
      checkpoints,
      regulatoryRecommendations: recommendations,
    };
  }
}
