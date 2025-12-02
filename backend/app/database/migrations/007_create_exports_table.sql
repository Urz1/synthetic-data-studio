-- Migration: Create exports table
-- Run this manually in your Neon console or via psql

CREATE TABLE IF NOT EXISTS exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What was exported
    export_type VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    
    -- Related entities (optional)
    generator_id UUID REFERENCES generators(id) ON DELETE SET NULL,
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- S3 storage info
    s3_key VARCHAR(1000) NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    
    -- Metadata
    metadata_json JSONB,
    
    -- Ownership
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Optional expiry
    expires_at TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exports_created_by ON exports(created_by);
CREATE INDEX IF NOT EXISTS idx_exports_generator_id ON exports(generator_id);
CREATE INDEX IF NOT EXISTS idx_exports_dataset_id ON exports(dataset_id);
CREATE INDEX IF NOT EXISTS idx_exports_project_id ON exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_export_type ON exports(export_type);
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);

-- Comment
COMMENT ON TABLE exports IS 'Tracks exported reports (PDFs, DOCXs) saved to S3 for audit trail and re-download';
