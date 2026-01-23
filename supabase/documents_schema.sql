-- Migration: Create documents table and storage setup
-- This migration creates the documents table for storing file metadata

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('contract', 'invoice', 'design', 'presentation', 'other')),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents table
-- Allow authenticated users to view all documents
CREATE POLICY "Users can view all documents"
    ON documents FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to upload documents
CREATE POLICY "Users can upload documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

-- Allow authenticated users to update document metadata
CREATE POLICY "Users can update documents"
    ON documents FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete documents
CREATE POLICY "Users can delete documents"
    ON documents FOR DELETE
    TO authenticated
    USING (true);

-- Note: Storage bucket and policies need to be created via Supabase Dashboard or CLI
-- Bucket name: 'documents'
-- Storage policies:
-- 1. SELECT: authenticated users can read all files
-- 2. INSERT: authenticated users can upload files
-- 3. UPDATE: authenticated users can update files
-- 4. DELETE: authenticated users can delete files
