import { X, Calendar, Euro, User, FileText, Clock, Tag, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ViewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

export function ViewProjectModal({ isOpen, onClose, project }: ViewProjectModalProps) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && project) {
            loadProjectDetails();
        }
    }, [isOpen, project]);

    const loadProjectDetails = async () => {
        try {
            setLoading(true);

            // Load tasks
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', project.id)
                .order('created_at', { ascending: false });

            setTasks(tasksData || []);

            // Load client if exists
            if (project.client_id) {
                const { data: clientData } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', project.client_id)
                    .single();

                setClient(clientData);
            }
        } catch (error) {
            console.error('Error loading project details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'todo': 'À Faire',
            'in-progress': 'En Cours',
            'review': 'En Révision',
            'done': 'Terminé',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'todo': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'review': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            'done': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
        return colors[status] || colors.todo;
    };

    const getPriorityLabel = (priority: string) => {
        const labels: Record<string, string> = {
            'low': 'Basse',
            'medium': 'Moyenne',
            'high': 'Haute',
        };
        return labels[priority] || priority;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            'low': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            'medium': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            'high': 'bg-red-500/20 text-red-300 border-red-500/30',
        };
        return colors[priority] || colors.medium;
    };

    if (!project) return null;

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
                            className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated/50">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2">{project.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(project.status)}>
                                            {getStatusLabel(project.status)}
                                        </Badge>
                                        <Badge className={getPriorityColor(project.priority)}>
                                            <Tag className="h-3 w-3 mr-1" />
                                            {getPriorityLabel(project.priority)}
                                        </Badge>
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
                                {/* Description */}
                                {project.description && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Description
                                        </h3>
                                        <p className="text-white bg-surface-elevated p-4 rounded-xl border border-border">
                                            {project.description}
                                        </p>
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Client */}
                                    {client && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Client
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <p className="text-white font-medium">{client.name}</p>
                                                {client.company && (
                                                    <p className="text-text-muted text-sm mt-1">{client.company}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Price */}
                                    {project.price && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <Euro className="h-4 w-4" />
                                                Budget
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <p className="text-white font-medium text-lg">
                                                    {parseFloat(project.price).toLocaleString('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'EUR'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    {project.deadline && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Deadline
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <p className="text-white font-medium">
                                                    {new Date(project.deadline).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Created */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Créé le
                                        </h3>
                                        <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                            <p className="text-white font-medium">
                                                {new Date(project.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                            <Euro className="h-4 w-4" />
                                            Paiement
                                        </h3>
                                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${project.is_paid
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                : 'bg-primary/10 border-primary/20 text-primary'
                                            }`}>
                                            {project.is_paid ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                            <div>
                                                <p className="font-bold uppercase tracking-wider text-xs">
                                                    {project.is_paid ? 'Payé' : 'Non payé'}
                                                </p>
                                                <p className="text-[10px] opacity-80 mt-0.5">
                                                    {project.is_paid
                                                        ? 'Ce projet est inclus dans les métriques financières.'
                                                        : 'Ce projet est masqué des métriques financières.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Tâches associées ({tasks.length})
                                    </h3>
                                    {loading ? (
                                        <div className="text-center py-8 text-text-muted">
                                            Chargement...
                                        </div>
                                    ) : tasks.length > 0 ? (
                                        <div className="space-y-2">
                                            {tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="bg-surface-elevated p-4 rounded-xl border border-border flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="text-white font-medium">{task.title}</p>
                                                        {task.description && (
                                                            <p className="text-text-muted text-sm mt-1 line-clamp-1">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge className={getStatusColor(task.status)}>
                                                        {getStatusLabel(task.status)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-text-muted bg-surface-elevated rounded-xl border border-border">
                                            Aucune tâche associée
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
