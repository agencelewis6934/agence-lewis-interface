import { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, Briefcase, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editMode?: boolean;
    clientData?: any;
}

export function CreateClientModal({ isOpen, onClose, onSuccess, editMode = false, clientData }: CreateClientModalProps) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        contact_name: '',
        company_name: '',
        job_title: '',
        email: '',
        phone: '',
        city: '',
        status: 'active',
        notes: '',
    });

    // Pre-fill form in edit mode
    useEffect(() => {
        if (isOpen && editMode && clientData) {
            setFormData({
                contact_name: clientData.contact_name || '',
                company_name: clientData.company_name || '',
                job_title: clientData.job_title || '',
                email: clientData.email || '',
                phone: clientData.phone || '',
                city: clientData.city || '',
                status: clientData.status || 'active',
                notes: clientData.notes || '',
            });
        }
    }, [isOpen, editMode, clientData]);

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
            if (!user) throw new Error('Utilisateur non authentifié');

            if (!formData.contact_name) {
                toast.error('Le nom du client est requis');
                setLoading(false);
                return;
            }

            const clientPayload = {
                contact_name: formData.contact_name,
                company_name: formData.company_name || null,
                job_title: formData.job_title || null,
                email: formData.email || null,
                phone: formData.phone || null,
                city: formData.city || null,
                status: formData.status,
                notes: formData.notes || null,
                avatar: getInitials(formData.contact_name),
            };

            if (editMode && clientData) {
                // Update existing client
                const { error: clientError } = await supabase
                    .from('clients')
                    .update(clientPayload)
                    .eq('id', clientData.id);

                if (clientError) throw clientError;

                toast.success('Client modifié avec succès !');
            } else {
                // Create new client
                const { error: clientError } = await supabase
                    .from('clients')
                    .insert({
                        ...clientPayload,
                        user_id: user.id,
                    });

                if (clientError) throw clientError;

                toast.success('Client créé avec succès !');
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error(`Error ${editMode ? 'updating' : 'creating'} client:`, error);
            toast.error(error.message || `Erreur lors de la ${editMode ? 'modification' : 'création'} du client`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            contact_name: '',
            company_name: '',
            job_title: '',
            email: '',
            phone: '',
            city: '',
            status: 'active',
            notes: '',
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
                            className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{editMode ? 'Modifier le Client' : 'Nouveau Client'}</h2>
                                    <p className="text-sm text-text-muted mt-1">{editMode ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client à votre base de données'}</p>
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
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4">
                                    <Input
                                        label="Nom du client"
                                        placeholder="Ex: Jean Dupont"
                                        leftIcon={<User className="h-4 w-4" />}
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Entreprise"
                                            placeholder="Ex: Tech Corp"
                                            leftIcon={<Building2 className="h-4 w-4" />}
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        />
                                        <Input
                                            label="Poste"
                                            placeholder="Ex: CEO"
                                            leftIcon={<Briefcase className="h-4 w-4" />}
                                            value={formData.job_title}
                                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Email"
                                            type="email"
                                            placeholder="client@example.com"
                                            leftIcon={<Mail className="h-4 w-4" />}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />

                                        <Input
                                            label="Téléphone"
                                            type="tel"
                                            placeholder="+33 6..."
                                            leftIcon={<Phone className="h-4 w-4" />}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Ville"
                                            placeholder="Ex: Paris"
                                            leftIcon={<MapPin className="h-4 w-4" />}
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                        <Select
                                            label="Statut"
                                            value={formData.status}
                                            onChange={(value) => setFormData({ ...formData, status: value })}
                                            options={[
                                                { value: 'active', label: 'Client Actif' },
                                                { value: 'prospect', label: 'Prospect' },
                                                { value: 'inactive', label: 'Inactif' },
                                            ]}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Notes / Commentaires</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                            rows={3}
                                            placeholder="Notes sur le client..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
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
                                        disabled={loading || !formData.contact_name}
                                    >
                                        {loading ? (editMode ? 'Modification...' : 'Création...') : (editMode ? 'Modifier le Client' : 'Créer le Client')}
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
