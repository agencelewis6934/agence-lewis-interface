import { X, Calendar, FolderKanban, FileText, Clock, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ViewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: any;
}

export function ViewTaskModal({ isOpen, onClose, task }: ViewTaskModalProps) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && task) {
            loadTaskDetails();
        }
    }, [isOpen, task]);

    const loadTaskDetails = async () => {
        try {
            setLoading(true);

            // Load project if exists
            if (task.project_id) {
                const { data: projectData } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', task.project_id)
                    .single();

                setProject(projectData);
            }
        } catch (error) {
            console.error('Error loading task details:', error);
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

    if (!task) return null;

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
                                    <h2 className="text-2xl font-bold text-white mb-2">{task.title}</h2>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(task.status)}>
                                            {getStatusLabel(task.status)}
                                        </Badge>
                                        <Badge className={getPriorityColor(task.priority)}>
                                            <Tag className="h-3 w-3 mr-1" />
                                            {getPriorityLabel(task.priority)}
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
                                {task.description && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Description
                                        </h3>
                                        <p className="text-white bg-surface-elevated p-4 rounded-xl border border-border">
                                            {task.description}
                                        </p>
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Project */}
                                    {project && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <FolderKanban className="h-4 w-4" />
                                                Projet
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <p className="text-white font-medium">{project.name}</p>
                                                {project.description && (
                                                    <p className="text-text-muted text-sm mt-1 line-clamp-2">{project.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    {task.deadline && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Deadline
                                            </h3>
                                            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                                <p className="text-white font-medium">
                                                    {new Date(task.deadline).toLocaleDateString('fr-FR', {
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
                                            Créée le
                                        </h3>
                                        <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                                            <p className="text-white font-medium">
                                                {new Date(task.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
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
