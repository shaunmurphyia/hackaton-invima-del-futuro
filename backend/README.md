# 💊 Pharma Regulatory CTD Intelligence Backend (NestJS + Supabase + AI Agents)

Backend inteligente de alto rendimiento para el análisis automatizado de expedientes regulatorios farmacéuticos (**CTD/eCTD**), extracción de texto, detección de principios activos (APIs) e investigación científica mediante agentes de Inteligencia Artificial.

---

## 🏛️ Arquitectura del Sistema

Construido siguiendo **Clean Architecture**, principios **SOLID** y el patrón **Ports & Adapters (Hexagonal)**:

- **Framework**: NestJS 10 + TypeScript
- **Base de Datos**: Supabase (PostgreSQL) con **Resilient Repository Fallback** (funciona en memoria si no hay conexión a internet para demos).
- **Documentación API**: Swagger OpenAPI 3.0 interactivo en `/api/docs`.
- **Extracción de PDF**: `IPdfExtractor` desacoplado (actualmente `pdf-parse`, extensible a AWS Textract / Google Document AI).
- **Detección de Moléculas**: `IMoleculeDetector` multicanal (patrones CAS, fórmulas químicas, sufijos farmacológicos OMS/FDA y agentes LLM).
- **Investigación Científica**: `IResearchProvider` (PubChem PUG REST API + Monografías FDA + Agentes de IA).

---

## 🚀 Inicio Rápido

### 1. Variables de Entorno
Copia el archivo de ejemplo o edita `.env`:
```bash
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-supabase-anon-or-service-role-key
MAX_FILE_SIZE_MB=25
```
> *Nota*: Si no configuras credenciales de Supabase, el backend utiliza automáticamente almacenamiento resiliente en memoria, asegurando que la demo nunca se caiga.

### 2. Base de Datos en Supabase (Opcional)
Si deseas persistir en PostgreSQL en la nube, copia y ejecuta el script [`src/database/schema.sql`](./src/database/schema.sql) en el **SQL Editor** de tu consola de Supabase.

### 3. Ejecución
```bash
# Modo desarrollo con auto-reload
npm run start:dev

# Compilación y producción
npm run build
npm run start:prod
```

### 4. Swagger UI
Una vez iniciado el servidor, accede a la documentación interactiva en:
👉 **`http://localhost:3000/api/docs`**

---

## 📡 Endpoints de la API REST

Todos los endpoints responden bajo el prefijo `/api/v1` con un formato JSON estandarizado:
`{ "success": true, "statusCode": 200, "timestamp": "...", "data": { ... } }`

| Método | Endpoint | Descripción | Body / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Estado del servicio y uptime | - |
| `POST` | `/api/v1/documents/upload` | Sube PDF regulatorio, extrae texto y metadatos | `multipart/form-data` con campo `file` |
| `GET` | `/api/v1/documents/:id` | Consulta expediente y texto extraído | `id` (UUID) |
| `GET` | `/api/v1/documents` | Lista todos los expedientes procesados | - |
| `POST` | `/api/v1/molecules/extract` | Extrae principios activos desde documento o texto | `{ "documentId": "uuid" }` o `{ "text": "..." }` |
| `GET` | `/api/v1/molecules/:id` | Detalle técnico de una molécula | `id` (UUID) |
| `GET` | `/api/v1/molecules/by-document/:documentId` | Moléculas asociadas a un expediente | `documentId` (UUID) |
| `POST` | `/api/v1/research/:moleculeId` | Dispara el Agente de Investigación Científica | `moleculeId` (UUID) |
| `GET` | `/api/v1/research/by-molecule/:moleculeId` | Historial de fichas científicas | `moleculeId` (UUID) |
| `GET` | `/api/v1/reports/:documentId` | **Reporte Consolidado para Frontend** (Dossier + Moléculas + Research) | `documentId` (UUID) |

---

## 🤖 Extensibilidad Futura: Agentes Autónomos

El proyecto incluye en `src/agents/interfaces/agent.interface.ts` los contratos limpios para conectar:
- `IDocumentAgent` & `IExtractionAgent` (OCR y segmentación de secciones CTD 3.2.S / 3.2.P)
- `IMoleculeAgent` (Detección por LLM Multimodal)
- `IResearchAgent` (Agente orquestador con adapters para PubChem, PubMed, FDA, INVIMA, DrugBank, ChemSpider)
- `IValidationAgent` & `IReportAgent` (Validación de consistencia y redacción ejecutiva)
