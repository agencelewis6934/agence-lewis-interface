import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, Image as ImageIcon, File } from 'lucide-react';
import { toast } from 'sonner';
import { uploadDocument } from '../../lib/documents';
import { useAuth } from '../../contexts/AuthContext';
import type { Document } from '../../types/documents';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: (document: Document) => void;
}

const CATEGORIES = [
    { value: 'contract', label: 'Contrat' },
    { value: 'invoice', label: 'Facture' },
    { value: 'design', label: 'Design' },
    { value: 'presentation', label: 'Présentation' },
    { value: 'other', label: 'Autre' }
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }: DocumentUploadModalProps) {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState<Document['category']>('other');
    const [tags, setTags] = useState<string>('');

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.size > MAX_FILE_SIZE) {
                    toast.error('Le fichier est trop volumineux (max 10MB)');
                    return;
                }
                setSelectedFile(file);
            }
        },
        maxFiles: 1,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        }
    });

    const handleUpload = async () => {
        if (!selectedFile || !user) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        setUploading(true);

        try {
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

            const { document, error } = await uploadDocument(
                {
                    file: selectedFile,
                    category,
                    tags: tagsArray
                },
                user.id
            );

            if (error) {
                throw error;
            }

            if (document) {
                toast.success('Document uploadé avec succès !');
                onUploadSuccess(document);
                handleClose();
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Erreur lors de l\'upload du document');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setCategory('other');
        setTags('');
        onClose();
    };

    const getFileIcon = () => {
        if (!selectedFile) return <Upload className="w-12 h-12 text-gray-400" />;

        if (selectedFile.type.startsWith('image/')) {
            return <ImageIcon className="w-12 h-12 text-blue-500" />;
        }
        if (selectedFile.type === 'application/pdf') {
            return <FileText className="w-12 h-12 text-red-500" />;
        }
        return <File className="w-12 h-12 text-gray-500" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Uploader un document</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center space-y-4">
                            {getFileIcon()}
                            {selectedFile ? (
                                <div>
                                    <p className="text-white font-medium">{selectedFile.name}</p>
                                    <p className="text-sm text-gray-400">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-white font-medium">
                                        Glissez un fichier ici ou cliquez pour sélectionner
                                    </p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        PDF, Images, Word, Excel (max 10MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Catégorie
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Document['category'])}
                            className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tags (séparés par des virgules)
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="urgent, client, 2024"
                            className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        disabled={uploading}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Upload en cours...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Uploader
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
