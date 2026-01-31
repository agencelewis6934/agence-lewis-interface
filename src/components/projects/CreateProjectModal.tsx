import { useState, useEffect } from 'react';
import { X, Plus, Building2, User, Euro, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [isNewClient, setIsNewClient] = useState(false);

    const [formData, setFormData] = useState({
        projectName: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        price: '',
        deadline: '',
        // Client fields
        existingClientId: '',
        newClientName: '',
        newClientCompany: '',
        newClientEmail: '',
        newClientPhone: '',
    });

    // Load existing clients
    useEffect(() => {
        if (isOpen) {
            loadClients();
        }
    }, [isOpen]);

    const loadClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name');

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            let clientId = formData.existingClientId;

            // Create new client if needed
            if (isNewClient) {
                if (!formData.newClientName) {
                    toast.error('Le nom du client est requis');
                    setLoading(false);
                    return;
                }

                const { data: newClient, error: clientError } = await supabase
                    .from('clients')
                    .insert({
                        name: formData.newClientName,
                        company: formData.newClientCompany,
                        email: formData.newClientEmail,
                        phone: formData.newClientPhone,
                        avatar: getInitials(formData.newClientName),
                        user_id: user.id,
                    })
                    .select()
                    .single();

                if (clientError) throw clientError;
                clientId = newClient.id;
            }

            // Create project
            const { error: projectError } = await supabase
                .from('projects')
                .insert({
                    name: formData.projectName,
                    client_id: clientId || null,
                    status: formData.status,
                    priority: formData.priority,
                    price: formData.price ? parseFloat(formData.price) : null,
                    description: formData.description,
                    deadline: formData.deadline || null,
                    user_id: user.id,
                })
                .select()
                .single();

            if (projectError) throw projectError;

            // If deadline, create calendar event
            if (formData.deadline) {
                await supabase.from('calendar_events').insert({
                    title: `Deadline: ${formData.projectName}`,
                    start_time: formData.deadline,
                    end_time: formData.deadline,
                    type: 'deadline',
                    description: `Deadline pour le projet ${formData.projectName}`,
                    user_id: user.id,
                });
            }

            toast.success('Projet créé avec succès !');
            onSuccess();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('Error creating project:', error);
            toast.error(error.message || 'Erreur lors de la création du projet');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            projectName: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            price: '',
            deadline: '',
            existingClientId: '',
            newClientName: '',
            newClientCompany: '',
            newClientEmail: '',
            newClientPhone: '',
        });
        setIsNewClient(false);
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
                                    <h2 className="text-2xl font-bold text-white">Nouveau Projet</h2>
                                    <p className="text-sm text-text-muted mt-1">Créez un nouveau projet et associez-le à un client</p>
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
                                    {/* Project Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Informations du Projet
                                        </h3>

                                        <Input
                                            label="Nom du projet"
                                            placeholder="Ex: Refonte site web"
                                            value={formData.projectName}
                                            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                            required
                                        />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-secondary">Description</label>
                                            <textarea
                                                className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                                rows={3}
                                                placeholder="Décrivez le projet en détail..."
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
                                                label="Priorité"
                                                value={formData.priority}
                                                onChange={(value) => setFormData({ ...formData, priority: value })}
                                                options={[
                                                    { value: 'low', label: 'Basse' },
                                                    { value: 'medium', label: 'Moyenne' },
                                                    { value: 'high', label: 'Haute' },
                                                ]}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Prix (€)"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                leftIcon={<Euro className="h-4 w-4" />}
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />

                                            <Input
                                                label="Deadline"
                                                type="date"
                                                leftIcon={<Calendar className="h-4 w-4" />}
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Client Information */}
                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <User className="h-5 w-5 text-primary" />
                                            Client
                                        </h3>

                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                variant={!isNewClient ? 'primary' : 'outline'}
                                                onClick={() => setIsNewClient(false)}
                                                className="flex-1"
                                            >
                                                Client Existant
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={isNewClient ? 'primary' : 'outline'}
                                                onClick={() => setIsNewClient(true)}
                                                className="flex-1"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Nouveau Client
                                            </Button>
                                        </div>

                                        {!isNewClient ? (
                                            <Select
                                                label="Sélectionner un client"
                                                value={formData.existingClientId}
                                                onChange={(value) => setFormData({ ...formData, existingClientId: value })}
                                                options={[
                                                    { value: '', label: 'Aucun client (optionnel)' },
                                                    ...clients.map(client => ({
                                                        value: client.id,
                                                        label: `${client.name}${client.company ? ` - ${client.company}` : ''}`
                                                    }))
                                                ]}
                                            />
                                        ) : (
                                            <div className="space-y-4 p-4 bg-surface-elevated/50 rounded-xl border border-border">
                                                <Input
                                                    label="Nom du client"
                                                    placeholder="Ex: Jean Dupont"
                                                    leftIcon={<User className="h-4 w-4" />}
                                                    value={formData.newClientName}
                                                    onChange={(e) => setFormData({ ...formData, newClientName: e.target.value })}
                                                    required={isNewClient}
                                                />

                                                <Input
                                                    label="Entreprise"
                                                    placeholder="Ex: Tech Corp"
                                                    leftIcon={<Building2 className="h-4 w-4" />}
                                                    value={formData.newClientCompany}
                                                    onChange={(e) => setFormData({ ...formData, newClientCompany: e.target.value })}
                                                />

                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input
                                                        label="Email"
                                                        type="email"
                                                        placeholder="client@example.com"
                                                        value={formData.newClientEmail}
                                                        onChange={(e) => setFormData({ ...formData, newClientEmail: e.target.value })}
                                                    />

                                                    <Input
                                                        label="Téléphone"
                                                        type="tel"
                                                        placeholder="+33 6 12 34 56 78"
                                                        value={formData.newClientPhone}
                                                        onChange={(e) => setFormData({ ...formData, newClientPhone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Message */}
                                    <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                                        <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-text-secondary">
                                            <p className="font-medium text-white mb-1">Synchronisation automatique</p>
                                            <p>Ce projet sera automatiquement ajouté au tableau Kanban, et la deadline apparaîtra dans le calendrier.</p>
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
                                        disabled={loading || !formData.projectName}
                                    >
                                        {loading ? 'Création...' : 'Créer le Projet'}
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
