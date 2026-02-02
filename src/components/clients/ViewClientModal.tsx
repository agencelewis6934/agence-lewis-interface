import { X, Building2, Mail, Phone, Clock, Tag, FolderKanban, FileText, Briefcase, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ViewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: any;
}

export function ViewClientModal({ isOpen, onClose, client }: ViewClientModalProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && client) {
            loadClientDetails();
        }
    }, [isOpen, client]);

    const loadClientDetails = async () => {
        try {
            setLoading(true);

            // Load projects for this client
            const { data: projectsData } = await supabase
                .from('projects')
                .select('*')
                .eq('client_id', client.id)
                .order('created_at', { ascending: false });

            setProjects(projectsData || []);
        } catch (error) {
            console.error('Error loading client details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'active': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            'prospect': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'inactive': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        };
        return colors[status] || colors.active;
    };

    if (!client) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated/50">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2">{client.contact_name}</h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className={getStatusColor(client.status)}>
                                            <Tag className="h-3 w-3 mr-1" />
                                            {client.status === 'active' ? 'Actif' : client.status === 'prospect' ? 'Prospect' : 'Inactif'}
                                        </Badge>
                                        {client.job_title && (
                                            <span className="text-text-muted text-sm flex items-center gap-1 bg-surface-elevated px-2 py-1 rounded-md border border-border">
                                                <Briefcase className="h-3 w-3" />
                                                {client.job_title}
                                            </span>
                                        )}
                                        {client.company_name && (
                                            <span className="text-text-muted text-sm flex items-center gap-1 bg-surface-elevated px-2 py-1 rounded-md border border-border">
                                                <Building2 className="h-3 w-3" />
                                                {client.company_name}
                                            </span>
                                        )}
                                        {client.city && (
                                            <span className="text-text-muted text-sm flex items-center gap-1 bg-surface-elevated px-2 py-1 rounded-md border border-border">
                                                <MapPin className="h-3 w-3" />
                                                {client.city}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-text-muted hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
                                {/* Contact Information */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Email */}
                                    {client.email && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <a href={`mailto:${client.email}`} className="text-white font-medium hover:text-primary transition-colors">
                                                    {client.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone */}
                                    {client.phone && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                Téléphone
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <a href={`tel:${client.phone}`} className="text-white font-medium hover:text-primary transition-colors">
                                                    {client.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Created */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Client depuis
                                        </h3>
                                        <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                            <p className="text-white font-medium">
                                                {new Date(client.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {client.notes && (
                                        <div className="col-span-2 space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Notes / Commentaires
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <p className="text-white whitespace-pre-wrap">{client.notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Projects */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4" />
                                        Projets associés ({projects.length})
                                    </h3>
                                    {loading ? (
                                        <div className="text-center py-8 text-text-muted">
                                            Chargement...
                                        </div>
                                    ) : projects.length > 0 ? (
                                        <div className="space-y-2">
                                            {projects.map((project) => (
                                                <div
                                                    key={project.id}
                                                    className="bg-surface-elevated p-4 rounded-xl border border-border"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">{project.name}</p>
                                                            {project.description && (
                                                                <p className="text-text-muted text-sm mt-1 line-clamp-1">
                                                                    {project.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {project.price && (
                                                            <p className="text-primary font-semibold">
                                                                {parseFloat(project.price).toLocaleString('fr-FR', {
                                                                    style: 'currency',
                                                                    currency: 'EUR'
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-text-muted bg-surface-elevated rounded-xl border border-border">
                                            Aucun projet associé
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-surface-elevated/50">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Fermer
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
