import { useState, useCallback } from 'react';
import { X, Upload, FileText, Download, CheckCircle2, AlertCircle, Users, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface ImportClientsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportClientsModal({ isOpen, onClose, onSuccess }: ImportClientsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        valid: 0,
        invalid: 0,
        duplicates: 0,
    });
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [csvContent, setCsvContent] = useState<string>('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleFileSelect(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
        },
        multiple: false,
    });

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setParsing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setCsvContent(content);

            Papa.parse(content, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rows = results.data as any[];
                    setPreview(rows.slice(0, 20)); // Preview 20 rows

                    // Simple client-side estimation of stats
                    const total = rows.length;
                    let valid = 0;
                    let invalid = 0;

                    // Basic validation logic (mirrors server)
                    const mapping = {
                        company_name: ['company', 'entreprise', 'company_name', 'societe'],
                        email: ['email', 'mail'],
                    };

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                    rows.forEach(row => {
                        const company_name = Object.keys(row).find(k =>
                            mapping.company_name.includes(k.toLowerCase().trim())
                        );
                        const emailKey = Object.keys(row).find(k =>
                            mapping.email.includes(k.toLowerCase().trim())
                        );
                        const emailValue = emailKey ? row[emailKey] : null;

                        if (company_name && row[company_name]) {
                            if (!emailValue || emailRegex.test(emailValue)) {
                                valid++;
                            } else {
                                invalid++;
                            }
                        } else {
                            invalid++;
                        }
                    });

                    setStats({
                        total,
                        valid,
                        invalid,
                        duplicates: 0, // Server will handle this
                    });
                    setParsing(false);
                },
                error: (err: any) => {
                    console.error('CSV Parsing error:', err);
                    toast.error('Erreur lors de l’analyse du fichier');
                    setParsing(false);
                }
            });
        };
        reader.readAsText(selectedFile);
    };

    const handleImport = async () => {
        if (!csvContent) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utilisateur non authentifié');

            const response = await fetch('/api/clients/import-csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    csvContent,
                    userId: user.id
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de l’importation');
            }

            toast.success(`${result.insertedCount} prospects importés avec succès !`);
            if (result.duplicateCount > 0) {
                toast.info(`${result.duplicateCount} doublons ignorés.`);
            }
            if (result.invalidCount > 0) {
                toast.warning(`${result.invalidCount} lignes invalides ignorées.`);
            }

            onSuccess();
            onClose();
            resetState();
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error.message || 'Erreur lors de l’importation');
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreview([]);
        setStats({ total: 0, valid: 0, invalid: 0, duplicates: 0 });
        setCsvContent('');
    };

    const downloadTemplate = () => {
        const headers = 'company_name,contact_name,email,phone,notes';
        const sample = 'Ma Super Entreprise,Jean Dupont,jean@example.com,+33612345678,Premier contact via site web';
        const csv = `${headers}\n${sample}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'modele_clients.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Upload className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Importer des Prospects</h2>
                                        <p className="text-sm text-text-muted mt-1">Créez des prospects en masse via un fichier CSV</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="text-text-muted hover:text-white">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {!file ? (
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-surface-elevated rounded-full ring-8 ring-surface">
                                                <Upload className="h-10 w-10 text-text-muted" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-white">Cliquez ou glissez un fichier CSV ici</p>
                                                <p className="text-sm text-text-muted mt-1">Format .csv uniquement, séparateur virgule ou point-virgule</p>
                                            </div>
                                            <Button type="button" variant="outline" className="mt-2">
                                                Parcourir les fichiers
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* File Info & Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="bg-surface-elevated p-4 rounded-2xl border border-border">
                                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <FileText className="h-3 w-3" /> Fichier
                                                </h3>
                                                <p className="text-white font-medium truncate">{file.name}</p>
                                                <p className="text-[10px] text-text-subtle mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <div className="bg-surface-elevated p-4 rounded-2xl border border-border">
                                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <Users className="h-3 w-3" /> Total
                                                </h3>
                                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                                            </div>
                                            <div className="bg-surface-elevated p-4 rounded-2xl border border-border border-emerald-500/20 bg-emerald-500/5">
                                                <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="h-3 w-3" /> Valides
                                                </h3>
                                                <p className="text-2xl font-bold text-emerald-500">{stats.valid}</p>
                                            </div>
                                            <div className="bg-surface-elevated p-4 rounded-2xl border border-border border-red-500/20 bg-red-500/5">
                                                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <AlertCircle className="h-3 w-3" /> Invalides
                                                </h3>
                                                <p className="text-2xl font-bold text-red-500">{stats.invalid}</p>
                                            </div>
                                        </div>

                                        {/* Preview Table */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-white">Aperçu (20 premières lignes)</h3>
                                                <button
                                                    onClick={() => setFile(null)}
                                                    className="text-xs text-primary hover:underline font-medium"
                                                >
                                                    Changer de fichier
                                                </button>
                                            </div>
                                            <div className="border border-border rounded-xl overflow-hidden bg-surface-elevated/30">
                                                <div className="overflow-x-auto max-h-[300px]">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-surface-elevated/50 sticky top-0">
                                                            <tr className="border-b border-border text-text-subtle uppercase">
                                                                {preview.length > 0 && Object.keys(preview[0]).map(key => (
                                                                    <th key={key} className="px-4 py-3 font-bold">{key}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/50">
                                                            {preview.map((row, i) => (
                                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                    {Object.values(row).map((val: any, j) => (
                                                                        <td key={j} className="px-4 py-3 text-text-secondary truncate max-w-[200px]">
                                                                            {val || <span className="text-text-muted italic">null</span>}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Rules / Info */}
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="text-xs text-text-secondary space-y-1">
                                        <p className="font-bold text-white uppercase tracking-wider">Règles d'importation</p>
                                        <ul className="list-disc list-inside space-y-0.5 opacity-80">
                                            <li>La colonne <strong>entreprise</strong> est obligatoire.</li>
                                            <li>Détection automatique : nom, email, téléphone, notes.</li>
                                            <li>Les doublons (email ou nom d'entreprise) sont ignorés.</li>
                                            <li>Tous les imports sont créés avec le statut <strong>prospect</strong>.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-6 border-t border-border bg-surface-elevated/50">
                                <Button
                                    variant="ghost"
                                    onClick={downloadTemplate}
                                    className="text-text-muted hover:text-white"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Modèle CSV
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={onClose} disabled={loading}>
                                        Annuler
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleImport}
                                        disabled={loading || parsing || stats.valid === 0}
                                        className="min-w-[120px]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Importation...
                                            </>
                                        ) : (
                                            `Importer ${stats.valid} prospects`
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
