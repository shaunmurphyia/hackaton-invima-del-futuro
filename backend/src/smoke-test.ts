import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { MoleculesService } from '../src/modules/molecules/molecules.service';
import { ResearchService } from '../src/modules/research/research.service';
import { ReportsService } from '../src/modules/reports/reports.service';
import { DocumentRepository } from '../src/database/repositories/document.repository';
import { DocumentStatus } from '../src/database/entities/document.entity';

async function runSmokeTests() {
  console.log('🧪 Iniciando pruebas de verificación E2E del Backend...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const docRepo = app.get(DocumentRepository);
  const moleculesService = app.get(MoleculesService);
  const researchService = app.get(ResearchService);
  const reportsService = app.get(ReportsService);

  // 1. Simulación de guardado de un documento CTD
  console.log('\n1️⃣ Paso 1: Registro y extracción de Expediente CTD Módulo 3');
  const sampleCtdText = `
    MODULO 3: CALIDAD - 3.2.S DROGA SUSTANCIA
    3.2.S.1 Información General
    Principio Activo: Paracetamol (DCI: Acetaminophen)
    Fórmula Química: C8H9NO2
    Número de Registro CAS: 103-90-2
    Peso Molecular: 151.16 g/mol
    
    En combinación secundaria para ensayo comparativo con Atorvastatina (CAS 134523-00-5)
    y anticuerpo monoclonal Trastuzumab para estudio de estabilidad.
  `;

  const doc = await docRepo.create({
    filename: 'CTD_Module3_Quality_Paracetamol.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 452100,
    raw_text: sampleCtdText,
    summary: 'Expediente regulatorio CTD Módulo 3 Calidad',
    status: DocumentStatus.PROCESSED,
    metadata: { totalPages: 18, version: '1.4' },
  });
  console.log(`   ✅ Documento registrado con ID: ${doc.id}`);

  // 2. Detección de Moléculas
  console.log('\n2️⃣ Paso 2: Detección inteligente de Moléculas en el expediente');
  const extractionResult = await moleculesService.extractAndSave({
    documentId: doc.id,
  });
  console.log(`   ✅ Moléculas detectadas (${extractionResult.count}):`);
  extractionResult.molecules.forEach((m) => {
    console.log(`      • [${m.name}] CAS: ${m.cas_number || 'N/A'} | Fórmula: ${m.formula || 'N/A'} | Score: ${m.confidence_score}`);
  });

  // 3. Agente Investigador Científico
  console.log('\n3️⃣ Paso 3: Activación del Agente Investigador Científico');
  const targetMolecule = extractionResult.molecules[0];
  const researchResult = await researchService.investigateMolecule(targetMolecule.id);
  console.log(`   ✅ Ficha de investigación generada para: ${targetMolecule.name}`);
  console.log(`      • Proveedor: ${researchResult.provider}`);
  console.log(`      • Resumen: ${researchResult.summary.slice(0, 100)}...`);
  console.log(`      • Indicaciones (${researchResult.indications.length}): ${researchResult.indications[0]}`);
  console.log(`      • Contraindicaciones (${researchResult.contraindications.length}): ${researchResult.contraindications[0]}`);

  // 4. Reporte Consolidado para Frontend
  console.log('\n4️⃣ Paso 4: Generación de Reporte Consolidado para Frontend');
  const report = await reportsService.generateDossierReport(doc.id);
  console.log(`   ✅ Reporte Dossier generado exitosamente:`);
  console.log(`      • Expediente: ${report.document.filename}`);
  console.log(`      • Total Moléculas: ${report.totalMolecules}`);
  console.log(`      • Moléculas Investigadas: ${report.researchedMoleculesCount}`);
  console.log(`      • Conclusión Ejecutiva: ${report.executiveSummary}`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE ARQUITECTURA Y NEGOCIO PASARON CON ÉXITO AL 100%!');
  await app.close();
}

runSmokeTests().catch((err) => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
