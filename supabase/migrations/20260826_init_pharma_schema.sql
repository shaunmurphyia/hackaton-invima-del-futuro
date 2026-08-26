-- ==============================================================================
-- SCHEMA SQL PARA SUPABASE / POSTGRESQL — PHARMA REGULATORY CTD INTELLIGENCE
-- ==============================================================================

-- 1. Tabla de Documentos Regulatorios (CTD / eCTD)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    file_size_bytes BIGINT,
    raw_text TEXT,
    summary TEXT,
    status VARCHAR(50) DEFAULT 'PROCESSED', -- PENDING, PROCESSING, PROCESSED, FAILED
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Moléculas e Ingredientes Farmacéuticos Activos (APIs)
CREATE TABLE IF NOT EXISTS molecules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    formula VARCHAR(100),
    cas_number VARCHAR(50),
    molecular_weight NUMERIC(10, 4),
    confidence_score NUMERIC(4, 3) DEFAULT 1.0,
    status VARCHAR(50) DEFAULT 'DETECTED', -- DETECTED, RESEARCHING, RESEARCHED, VALIDATED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Investigación Científica y Fichas Regulatorias
CREATE TABLE IF NOT EXISTS research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    molecule_id UUID REFERENCES molecules(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL, -- PubChem, FDA, PubMed, INVIMA, GeminiAgent, etc.
    raw_data JSONB DEFAULT '{}'::jsonb,
    summary TEXT NOT NULL,
    indications TEXT[] DEFAULT '{}',
    contraindications TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento para búsquedas y joins
CREATE INDEX IF NOT EXISTS idx_molecules_document_id ON molecules(document_id);
CREATE INDEX IF NOT EXISTS idx_research_molecule_id ON research(molecule_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
