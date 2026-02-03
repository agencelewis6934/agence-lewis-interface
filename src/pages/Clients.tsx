import { useState, useEffect, useMemo } from 'react';
import { ImportClientsModal } from '../components/clients/ImportClientsModal';
import { Sparkles, TrendingUp, Filter, Search, Plus, User, Mail, Phone, MoreHorizontal, Trash2, Edit2, Eye, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/Dropdown';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Select } from '../components/ui/Select';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { CreateClientModal } from '../components/clients/CreateClientModal';
import { ViewClientModal } from '../components/clients/ViewClientModal';

export function Clients() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Renamed from isModalOpen
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; clientId: string | null; clientName: string }>({ isOpen: false, clientId: null, clientName: '' });
    const [viewModal, setViewModal] = useState<{ isOpen: boolean; client: any | null }>({ isOpen: false, client: null });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; client: any | null }>({ isOpen: false, client: null });
    const [contactFilterType, setContactFilterType] = useState<'all' | 'email_phone' | 'email_only' | 'phone_only'>('all');
    const [statusFilter, setStatusFilter] = useState<'prospect' | 'active' | 'inactive' | null>(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*, projects(count)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error: any) {
            console.error('Error loading clients:', error);
            toast.error('Erreur lors du chargement des clients');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch = (client.contact_name && client.contact_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.company_name && client.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()));

            let matchesContact = true;
            if (contactFilterType === 'email_phone') {
                matchesContact = client.email && client.phone;
            } else if (contactFilterType === 'email_only') {
                matchesContact = client.email && !client.phone;
            } else if (contactFilterType === 'phone_only') {
                matchesContact = client.phone && !client.email;
            }

            const matchesStatus = !statusFilter || client.status === statusFilter;

            return matchesSearch && matchesContact && matchesStatus;
        });
    }, [clients, searchQuery, contactFilterType, statusFilter]);

    const pipeline = useMemo(() => {
        const counts = {
            Prospects: clients.filter(c => c.status === 'prospect').length,
            Active: clients.filter(c => c.status === 'active').length,
            Inactive: clients.filter(c => c.status === 'inactive').length,
        };

        return [
            { stage: 'Prospects', count: counts.Prospects, color: 'from-blue-500 to-cyan-600', icon: Sparkles, id: 'prospect' },
            { stage: 'Clients Actifs', count: counts.Active, color: 'from-emerald-500 to-teal-600', icon: TrendingUp, id: 'active' },
            { stage: 'Inactifs', count: counts.Inactive, color: 'from-gray-500 to-gray-600', icon: Filter, id: 'inactive' },
        ];
    }, [clients]);

    const handleDeleteClient = async () => {
        if (!deleteConfirm.clientId) return;

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', deleteConfirm.clientId);

            if (error) throw error;
            toast.success('Client supprimé avec succès');
            loadClients();
            setDeleteConfirm({ isOpen: false, clientId: null, clientName: '' });
        } catch (error: any) {
            toast.error('Erreur lors de la suppression');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-5xl font-bold tracking-tight mb-2">
                        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                            Gestion Clients
                        </span>
                    </h2>
                    <p className="text-text-muted text-lg">
                        Suivez vos clients et votre pipeline commercial
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsImportModalOpen(true)}
                        className="border-border hover:border-primary/50 group"
                    >
                        <Upload className="mr-2 h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
                        Importer CSV
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="shadow-lg shadow-primary/20"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Client
                    </Button>
                </div>
            </motion.div>

            {/* Pipeline Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-6 md:grid-cols-3"
            >
                {pipeline.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        onClick={() => setStatusFilter(statusFilter === item.id ? null : item.id as any)}
                        className="cursor-pointer"
                    >
                        <Card hoverable className={cn(
                            "group relative overflow-hidden transition-all duration-300",
                            statusFilter === item.id ? "ring-2 ring-primary scale-[1.02] bg-surface-elevated" : "bg-opacity-40 backdrop-blur-md hover:bg-surface-elevated/50",
                            statusFilter && statusFilter !== item.id && "opacity-50 grayscale-[0.5]"
                        )}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                            <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <item.icon className="h-32 w-32" />
                            </div>

                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                                    {item.stage}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-white font-display mb-1">
                                    {item.count}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Clients Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="overflow-hidden bg-opacity-60 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between bg-surface-elevated/50 py-5 px-6 border-b border-border-subtle">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-80">
                                <Input
                                    placeholder="Filtrer par nom, entreprise..."
                                    leftIcon={<Search className="h-4 w-4" />}
                                    className="bg-surface border-border h-11"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="w-64">
                                <Select
                                    value={contactFilterType}
                                    onChange={(value) => setContactFilterType(value as any)}
                                    options={[
                                        { value: 'all', label: 'Tous les contacts' },
                                        { value: 'email_phone', label: 'Email & Téléphone' },
                                        { value: 'email_only', label: 'Email uniquement' },
                                        { value: 'phone_only', label: 'Téléphone uniquement' },
                                    ]}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <p className="text-sm text-text-subtle font-medium">{filteredClients.length} clients trouvés</p>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border-subtle text-text-subtle text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Projets</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4 text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-text-muted">Chargement des clients...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-4 bg-surface-elevated rounded-full">
                                                        <User className="h-8 w-8 opacity-20" /> {/* Changed from Users to User */}
                                                    </div>
                                                    <p>Aucun client trouvé</p>
                                                    <Button variant="ghost" className="text-primary" onClick={() => setIsCreateModalOpen(true)}> {/* Changed to setIsCreateModalOpen */}
                                                        Ajouter votre premier client
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClients.map((client, idx) => (
                                            <motion.tr
                                                key={client.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.05 }}
                                                className="group hover:bg-surface-elevated/30 transition-colors"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar
                                                            fallback={client.avatar || (client.contact_name ? client.contact_name[0] : 'C')}
                                                            className="h-11 w-11 ring-2 ring-border-subtle group-hover:ring-primary/40 transition-all text-sm font-bold"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                                                {client.contact_name}
                                                            </p>
                                                            <p className="text-xs text-text-subtle">{client.company_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge
                                                        variant={client.status === 'active' ? 'success' : client.status === 'prospect' ? 'warning' : 'neutral'}
                                                    >
                                                        {client.status === 'active' ? 'Actif' : client.status === 'prospect' ? 'Prospect' : 'Inactif'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-white">{client.projects?.[0]?.count || 0}</span>
                                                        <span className="text-xs text-text-subtle">projets</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex gap-2">
                                                        {client.email && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
                                                                onClick={() => window.open(`mailto:${client.email}`)}
                                                            >
                                                                <Mail className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {client.phone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
                                                                onClick={() => window.open(`tel:${client.phone}`)}
                                                            >
                                                                <Phone className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-text-subtle hover:text-white">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem icon={<Eye className="h-4 w-4" />} onClick={() => setViewModal({ isOpen: true, client })}>
                                                                Voir le profil
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem icon={<Edit2 className="h-4 w-4" />} onClick={() => setEditModal({ isOpen: true, client })}>
                                                                Modifier
                                                            </DropdownMenuItem>
                                                            <div className="h-px bg-border-subtle my-1" />
                                                            <DropdownMenuItem
                                                                destructive
                                                                icon={<Trash2 className="h-4 w-4" />}
                                                                onClick={() => setDeleteConfirm({ isOpen: true, clientId: client.id, clientName: client.contact_name })}
                                                            >
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadClients}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, clientId: null, clientName: '' })}
                onConfirm={handleDeleteClient}
                title="Supprimer le client"
                message={`Êtes-vous sûr de vouloir supprimer le client "${deleteConfirm.clientName}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                destructive
            />

            {/* View Client Modal */}
            <ImportClientsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={loadClients}
            />

            <ViewClientModal
                isOpen={viewModal.isOpen}
                onClose={() => setViewModal({ isOpen: false, client: null })}
                client={viewModal.client}
            />

            {/* Edit Client Modal */}
            <CreateClientModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, client: null })}
                onSuccess={loadClients}
                editMode={true}
                clientData={editModal.client}
            />
        </div>
    );
}
