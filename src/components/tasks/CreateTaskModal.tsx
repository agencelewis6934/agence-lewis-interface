import { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, FolderKanban, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        deadline: '',
        projectId: '',
    });

    // Load existing projects
    useEffect(() => {
        if (isOpen) {
            loadProjects();
        }
    }, [isOpen]);

    const loadProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Create task
            const { error: taskError } = await supabase
                .from('tasks')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    status: formData.status,
                    priority: formData.priority,
                    deadline: formData.deadline || null,
                    project_id: formData.projectId || null,
                    user_id: user.id,
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // If deadline, create calendar event
            if (formData.deadline) {
                await supabase.from('calendar_events').insert({
                    title: `Tâche: ${formData.title}`,
                    start_time: formData.deadline,
                    end_time: formData.deadline,
                    type: 'task',
                    description: `Deadline pour la tâche ${formData.title}`,
                    user_id: user.id,
                });
            }

            toast.success('Tâche créée avec succès !');
            onSuccess();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('Error creating task:', error);
            toast.error(error.message || 'Erreur lors de la création de la tâche');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            deadline: '',
            projectId: '',
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
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
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Nouvelle Tâche</h2>
                                    <p className="text-sm text-text-muted mt-1">Créez une nouvelle tâche et associez-la à un projet</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClose}
                                    className="text-text-muted hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                                <div className="p-6 space-y-6">
                                    {/* Task Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Informations de la Tâche
                                        </h3>

                                        <Input
                                            label="Tâche à réaliser"
                                            placeholder="Ex: Créer les maquettes UI"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-secondary">Description</label>
                                            <textarea
                                                className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                                rows={3}
                                                placeholder="Décrivez la tâche en détail..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Select
                                                label="Statut"
                                                value={formData.status}
                                                onChange={(value) => setFormData({ ...formData, status: value })}
                                                options={[
                                                    { value: 'todo', label: 'À Faire' },
                                                    { value: 'in-progress', label: 'En Cours' },
                                                    { value: 'review', label: 'En Révision' },
                                                    { value: 'done', label: 'Terminé' },
                                                ]}
                                            />

                                            <Select
                                                label="Importance"
                                                value={formData.priority}
                                                onChange={(value) => setFormData({ ...formData, priority: value })}
                                                options={[
                                                    { value: 'low', label: 'Basse' },
                                                    { value: 'medium', label: 'Moyenne' },
                                                    { value: 'high', label: 'Haute' },
                                                ]}
                                            />
                                        </div>

                                        <Input
                                            label="Date limite"
                                            type="date"
                                            leftIcon={<Calendar className="h-4 w-4" />}
                                            value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        />
                                    </div>

                                    {/* Project Association */}
                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <FolderKanban className="h-5 w-5 text-primary" />
                                            Projet Associé
                                        </h3>

                                        <Select
                                            label="Sélectionner un projet"
                                            value={formData.projectId}
                                            onChange={(value) => setFormData({ ...formData, projectId: value })}
                                            options={[
                                                { value: '', label: 'Aucun projet (optionnel)' },
                                                ...projects.map(project => ({
                                                    value: project.id,
                                                    label: project.name
                                                }))
                                            ]}
                                        />
                                    </div>

                                    {/* Info Message */}
                                    <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                                        <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-text-secondary">
                                            <p className="font-medium text-white mb-1">Synchronisation automatique</p>
                                            <p>Cette tâche sera automatiquement ajoutée au tableau Kanban, et la deadline apparaîtra dans le calendrier.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-surface-elevated/50">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        disabled={loading}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading || !formData.title}
                                    >
                                        {loading ? 'Création...' : 'Créer la Tâche'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
