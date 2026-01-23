export interface Document {
    id: string;
    name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    uploaded_by: string;
    category?: 'contract' | 'invoice' | 'design' | 'presentation' | 'other';
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface DocumentUploadData {
    file: File;
    category?: Document['category'];
    tags?: string[];
}

export type DocumentViewMode = 'grid' | 'list';

export interface DocumentFilters {
    category?: Document['category'];
    search?: string;
    tags?: string[];
}
