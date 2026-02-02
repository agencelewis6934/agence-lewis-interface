import { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone } from 'lucide-react';
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
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'Active',
    });

    // Pre-fill form in edit mode
    useEffect(() => {
        if (isOpen && editMode && clientData) {
            setFormData({
                name: clientData.name || '',
                company: clientData.company || '',
                email: clientData.email || '',
                phone: clientData.phone || '',
                status: clientData.status || 'Active',
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

            if (!formData.name) {
                toast.error('Le nom du client est requis');
                setLoading(false);
                return;
            }

            if (editMode && clientData) {
                // Update existing client
                const { error: clientError } = await supabase
                    .from('clients')
                    .update({
                        name: formData.name,
                        company: formData.company || null,
                        email: formData.email || null,
                        phone: formData.phone || null,
                        status: formData.status,
                        avatar: getInitials(formData.name),
                    })
                    .eq('id', clientData.id);

                if (clientError) throw clientError;

                toast.success('Client modifié avec succès !');
            } else {
                // Create new client
                const { error: clientError } = await supabase
                    .from('clients')
                    .insert({
                        name: formData.name,
                        company: formData.company || null,
                        email: formData.email || null,
                        phone: formData.phone || null,
                        status: formData.status,
                        avatar: getInitials(formData.name),
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
            name: '',
            company: '',
            email: '',
            phone: '',
            status: 'Active',
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
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="Entreprise"
                                        placeholder="Ex: Tech Corp"
                                        leftIcon={<Building2 className="h-4 w-4" />}
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    />

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
                                            placeholder="+33 6 12 34 56 78"
                                            leftIcon={<Phone className="h-4 w-4" />}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>

                                    <Select
                                        label="Statut"
                                        value={formData.status}
                                        onChange={(value) => setFormData({ ...formData, status: value })}
                                        options={[
                                            { value: 'Active', label: 'Client Actif' },
                                            { value: 'Lead', label: 'Prospect' },
                                            { value: 'Inactive', label: 'Inactif' },
                                        ]}
                                    />
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
                                        disabled={loading || !formData.name}
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
