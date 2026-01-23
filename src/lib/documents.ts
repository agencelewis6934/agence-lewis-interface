import { supabase } from '../lib/supabase';
import type { Document, DocumentUploadData } from '../types/documents';

const BUCKET_NAME = 'documents';

/**
 * Upload a file to Supabase Storage and create metadata entry
 */
export async function uploadDocument(
    data: DocumentUploadData,
    userId: string
): Promise<{ document: Document | null; error: any }> {
    try {
        const { file, category, tags } = data;

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Upload file to Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Create metadata entry in database
        const { data: document, error: dbError } = await supabase
            .from('documents')
            .insert({
                name: file.name,
                file_path: filePath,
                file_type: file.type,
                file_size: file.size,
                uploaded_by: userId,
                category: category || 'other',
                tags: tags || []
            })
            .select()
            .single();

        if (dbError) {
            // If database insert fails, delete the uploaded file
            await supabase.storage.from(BUCKET_NAME).remove([filePath]);
            throw dbError;
        }

        return { document, error: null };
    } catch (error) {
        console.error('Error uploading document:', error);
        return { document: null, error };
    }
}

/**
 * Get public URL for a document
 */
export function getDocumentUrl(filePath: string): string {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Download a document
 */
export async function downloadDocument(filePath: string, fileName: string): Promise<{ error: any }> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(filePath);

        if (error) throw error;

        // Create download link
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { error: null };
    } catch (error) {
        console.error('Error downloading document:', error);
        return { error };
    }
}

/**
 * Delete a document (both file and metadata)
 */
export async function deleteDocument(id: string, filePath: string): Promise<{ error: any }> {
    try {
        // Delete from Storage
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (storageError) throw storageError;

        // Delete metadata from database
        const { error: dbError } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        return { error: null };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { error };
    }
}

/**
 * Get all documents with optional filters
 */
export async function getDocuments(filters?: {
    category?: string;
    search?: string;
}): Promise<{ documents: Document[]; error: any }> {
    try {
        let query = supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { documents: data || [], error: null };
    } catch (error) {
        console.error('Error fetching documents:', error);
        return { documents: [], error };
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊';
    return '📎';
}
