import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { ReportsService } from '../src/modules/reports/reports.service';
import { DocumentRepository } from '../src/database/repositories/document.repository';
import { DocumentStatus } from '../src/database/entities/document.entity';
import { MoleculesService } from '../src/modules/molecules/molecules.service';
import { ResearchService } from '../src/modules/research/research.service';

async function runSmokeTests() {
  console.log('🧪 Iniciando pruebas de verificación E2E del Backend con Auditoría INVIMA...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const docRepo = app.get(DocumentRepository);
  const moleculesService = app.get(MoleculesService);
  const researchService = app.get(ResearchService);
  const reportsService = app.get(ReportsService);

  // 1. Simulación de guardado de un documento CTD con requerimientos INVIMA
  console.log('\n1️⃣ Paso 1: Registro de Expediente CTD Módulo 3');
  const sampleCtdText = `
    MODULO 3: CALIDAD - 3.2.S DROGA SUSTANCIA
    3.2.S.1 Información General
    Principio Activo: Paracetamol (DCI: Acetaminophen)
    Fórmula Química: C8H9NO2
    Número de Registro CAS: 103-90-2
    Peso Molecular: 151.16 g/mol
    
    3.2.P PRODUCTO TERMINADO
    Forma farmacéutica: Tabletas 500mg.
    Estudios de estabilidad realizados bajo condiciones de Zona Climática IVB (30°C ± 2°C / 75% HR ± 5% HR).
    Control de impurezas orgánicas mediante HPLC validado. Certificado BPM vigente.
  `;

  const doc = await docRepo.create({
    filename: 'Expediente_INVIMA_CTD_M3_Paracetamol.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 452100,
    raw_text: sampleCtdText,
    summary: 'Expediente regulatorio CTD Módulo 3 Calidad',
    status: DocumentStatus.PROCESSED,
    metadata: { totalPages: 18, version: '1.4' },
  });
  console.log(`   ✅ Documento registrado con ID: ${doc.id}`);

  // 2. Detección de Moléculas
  console.log('\n2️⃣ Paso 2: Detección de Moléculas');
  const extractionResult = await moleculesService.extractAndSave({
    documentId: doc.id,
  });
  console.log(`   ✅ Moléculas detectadas (${extractionResult.count}):`);
  for (const m of extractionResult.molecules) {
    console.log(`      • [${m.name}] CAS: ${m.cas_number || 'N/A'} | Fórmula: ${m.formula || 'N/A'}`);
    await researchService.investigateMolecule(m.id);
  }

  // 3. Reporte Consolidado con Auditoría INVIMA
  console.log('\n3️⃣ Paso 3: Generación de Reporte con Auditoría INVIMA');
  const report = await reportsService.generateDossierReport(doc.id);
  console.log(`   ✅ Reporte Dossier generado exitosamente:`);
  console.log(`      • Expediente: ${report.document.filename}`);
  console.log(`      • Total Moléculas: ${report.totalMolecules}`);
  console.log(`      • Moléculas Investigadas: ${report.researchedMoleculesCount}`);
  console.log(`      • Score INVIMA: ${report.invimaCompliance.score}% (${report.invimaCompliance.status})`);
  console.log(`      • Categoría de Producto: ${report.invimaCompliance.productCategory}`);
  console.log(`      • Requisitos de Estabilidad: ${report.invimaCompliance.stabilityZoneRequirement}`);
  console.log(`      • Checkpoints auditados: ${report.invimaCompliance.checkpoints.length}`);
  report.invimaCompliance.checkpoints.forEach((cp) => {
    console.log(`        - [${cp.status}] ${cp.code}: ${cp.requirement}`);
  });

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE PIPELINE Y AUDITORÍA INVIMA PASARON AL 100%!');
  await app.close();
}

runSmokeTests().catch((err) => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
