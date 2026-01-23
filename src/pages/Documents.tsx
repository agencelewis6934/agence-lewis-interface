import { useState, useEffect } from 'react';
import { Upload, Grid, List, Search, Download, Trash2, Eye, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { getDocuments, deleteDocument, downloadDocument, formatFileSize, getDocumentUrl } from '../lib/documents';
import type { Document, DocumentViewMode } from '../types/documents';

const CATEGORIES = [
    { value: 'all', label: 'Tous' },
    { value: 'contract', label: 'Contrats' },
    { value: 'invoice', label: 'Factures' },
    { value: 'design', label: 'Designs' },
    { value: 'presentation', label: 'Présentations' },
    { value: 'other', label: 'Autres' }
];

export function Documents() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<DocumentViewMode>('grid');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

    useEffect(() => {
        loadDocuments();
    }, [selectedCategory, searchQuery]);

    const loadDocuments = async () => {
        setLoading(true);
        const { documents: docs, error } = await getDocuments({
            category: selectedCategory,
            search: searchQuery
        });

        if (error) {
            toast.error('Erreur lors du chargement des documents');
        } else {
            setDocuments(docs);
        }
        setLoading(false);
    };

    const handleUploadSuccess = (document: Document) => {
        setDocuments([document, ...documents]);
    };

    const handleDelete = async (doc: Document) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${doc.name}" ?`)) {
            return;
        }

        const { error } = await deleteDocument(doc.id, doc.file_path);
        if (error) {
            toast.error('Erreur lors de la suppression');
        } else {
            toast.success('Document supprimé');
            setDocuments(documents.filter(d => d.id !== doc.id));
            if (selectedDocument?.id === doc.id) {
                setSelectedDocument(null);
            }
        }
    };

    const handleDownload = async (doc: Document) => {
        const { error } = await downloadDocument(doc.file_path, doc.name);
        if (error) {
            toast.error('Erreur lors du téléchargement');
        }
    };

    const getFileIconComponent = (fileType: string) => {
        if (fileType.startsWith('image/')) {
            return <ImageIcon className="w-6 h-6 text-blue-500" />;
        }
        if (fileType === 'application/pdf') {
            return <FileText className="w-6 h-6 text-red-500" />;
        }
        return <FileIcon className="w-6 h-6 text-gray-400" />;
    };

    const renderDocumentCard = (doc: Document) => {
        const isImage = doc.file_type.startsWith('image/');
        const isPDF = doc.file_type === 'application/pdf';
        const url = getDocumentUrl(doc.file_path);

        return (
            <div
                key={doc.id}
                className="bg-[#1a1f2e] rounded-lg border border-gray-700 hover:border-gray-600 transition-all overflow-hidden group"
            >
                {/* Preview */}
                <div className="aspect-video bg-[#0f1419] flex items-center justify-center relative overflow-hidden">
                    {isImage ? (
                        <img
                            src={url}
                            alt={doc.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            {getFileIconComponent(doc.file_type)}
                            <span className="text-xs text-gray-400 uppercase">
                                {doc.file_type.split('/')[1] || 'file'}
                            </span>
                        </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            onClick={() => setSelectedDocument(doc)}
                            className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            title="Voir"
                        >
                            <Eye className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={() => handleDownload(doc)}
                            className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            title="Télécharger"
                        >
                            <Download className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={() => handleDelete(doc)}
                            className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="p-4">
                    <h3 className="text-white font-medium truncate" title={doc.name}>
                        {doc.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                        <span>{formatFileSize(doc.file_size)}</span>
                        {doc.category && (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                                {CATEGORIES.find(c => c.value === doc.category)?.label}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0f1419] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Documents</h1>
                    <p className="text-gray-400 mt-1">
                        {documents.length} document{documents.length > 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Upload className="w-5 h-5" />
                    Uploader
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                            {cat.label}
                        </option>
                    ))}
                </select>

                {/* View Mode */}
                <div className="flex items-center gap-2 bg-[#1a1f2e] border border-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-colors ${viewMode === 'grid'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${viewMode === 'list'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Documents Grid/List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <FileIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg">Aucun document trouvé</p>
                    <p className="text-sm mt-2">Uploadez votre premier document pour commencer</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                    {documents.map(renderDocumentCard)}
                </div>
            )}

            {/* Upload Modal */}
            <DocumentUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            {/* Document Viewer Modal */}
            {selectedDocument && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1f2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-white font-medium">{selectedDocument.name}</h3>
                            <button
                                onClick={() => setSelectedDocument(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {selectedDocument.file_type.startsWith('image/') ? (
                                <img
                                    src={getDocumentUrl(selectedDocument.file_path)}
                                    alt={selectedDocument.name}
                                    className="max-w-full h-auto mx-auto"
                                />
                            ) : selectedDocument.file_type === 'application/pdf' ? (
                                <iframe
                                    src={getDocumentUrl(selectedDocument.file_path)}
                                    className="w-full h-[600px] border-0"
                                    title={selectedDocument.name}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <FileIcon className="w-16 h-16 mb-4" />
                                    <p>Aperçu non disponible pour ce type de fichier</p>
                                    <button
                                        onClick={() => handleDownload(selectedDocument)}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Télécharger
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
