import { useState, useMemo } from 'react';
import { Mail, MoreVertical, Plus, Star, Zap, Target, Calendar, Trash2, UserCog, Eye, Search, LayoutGrid, List, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/Dropdown';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const team = [
    {
        id: 1,
        name: 'Antoine Pivodan',
        role: 'Fondateur / Designer',
        workload: 85,
        status: 'Available',
        avatar: 'AP',
        skills: ['Design UI/UX', 'Framer', 'Strategy'],
        performance: 98,
        projects: 4
    },
    {
        id: 2,
        name: 'Ilies Bennani',
        role: 'Full-stack Developer',
        workload: 100,
        status: 'Busy',
        avatar: 'IB',
        skills: ['React', 'Node.js', 'Supabase'],
        performance: 95,
        projects: 6
    },
    {
        id: 3,
        name: 'Sophie Martin',
        role: 'Chef de Projet',
        workload: 60,
        status: 'Available',
        avatar: 'SM',
        skills: ['Agile', 'Communication', 'Planning'],
        performance: 92,
        projects: 2
    },
    {
        id: 4,
        name: 'Lucas Dubois',
        role: 'Motion Designer',
        workload: 40,
        status: 'Available',
        avatar: 'LD',
        skills: ['After Effects', 'Cinema 4D', 'Animation'],
        performance: 88,
        projects: 3
    }
];

export function Team() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    const filteredTeam = useMemo(() => {
        return team.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, filterStatus]);

    const handleAddMember = () => {
        toast.success("Membre ajouté avec succès !");
        setIsAddMemberModalOpen(false);
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-5xl font-bold tracking-tight mb-2">
                            <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                                Équipe
                            </span>
                        </h2>
                        <p className="text-text-muted text-lg">
                            Gérez vos talents, leur charge de travail et leurs performances
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" onClick={() => setIsAddMemberModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un membre
                        </Button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-surface/30 backdrop-blur-xl">
                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                        <div className="w-full max-w-sm">
                            <Input
                                placeholder="Rechercher un membre..."
                                leftIcon={<Search className="h-4 w-4" />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            options={[
                                { value: 'all', label: 'Tous les statuts' },
                                { value: 'Available', label: 'Disponible' },
                                { value: 'Busy', label: 'Occupé' },
                            ]}
                            className="w-48"
                        />
                    </div>

                    <div className="glass-dark p-1 rounded-xl border border-border flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`h-9 px-4 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-text-subtle'}`}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" /> Grille
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`h-9 px-4 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-text-subtle'}`}
                        >
                            <List className="h-4 w-4 mr-2" /> Liste
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Team Members */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {filteredTeam.map((member, idx) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card hoverable className="group relative overflow-hidden bg-opacity-40 backdrop-blur-md h-full">
                                    {/* Gradient accent */}
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-violet-500 to-transparent" />

                                    {/* Header with Avatar */}
                                    <CardHeader className="flex flex-row items-center gap-5 pb-5">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                        >
                                            <Avatar
                                                fallback={member.avatar}
                                                className="h-20 w-20 text-2xl ring-4 ring-border-subtle group-hover:ring-primary/30 transition-all shadow-xl"
                                            />
                                        </motion.div>
                                        <div className="space-y-1.5 flex-1">
                                            <CardTitle className="text-white text-xl group-hover:text-primary transition-colors">
                                                {member.name}
                                            </CardTitle>
                                            <p className="text-sm text-text-muted font-semibold">{member.role}</p>
                                            <Badge
                                                variant={member.status === 'Available' ? 'success' : 'warning'}
                                                className="mt-1.5"
                                            >
                                                {member.status === 'Available' ? 'Disponible' : 'Occupé'}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-text-subtle hover:text-white -mr-2 -mt-2"
                                                >
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem icon={<Eye className="h-4 w-4" />} onClick={() => toast.info(`Viewing ${member.name}'s profile`)}>
                                                    Voir le profil
                                                </DropdownMenuItem>
                                                <DropdownMenuItem icon={<UserCog className="h-4 w-4" />} onClick={() => toast.success("Access management coming soon")}>
                                                    Gérer les accès
                                                </DropdownMenuItem>
                                                <div className="h-px bg-border-subtle my-1" />
                                                <DropdownMenuItem
                                                    destructive
                                                    icon={<Trash2 className="h-4 w-4" />}
                                                    onClick={() => toast.error(`Removed ${member.name} from team`)}
                                                >
                                                    Retirer de l'équipe
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        {/* Workload */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                                                    <span className="text-text-muted uppercase tracking-widest font-bold">Charge de travail</span>
                                                </div>
                                                <span className={`text-sm font-black ${member.workload > 90 ? 'text-danger' : 'text-primary'}`}>
                                                    {member.workload}%
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full bg-surface-hover rounded-full overflow-hidden shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${member.workload}%` }}
                                                    transition={{ delay: 0.3 + idx * 0.1, duration: 1 }}
                                                    className={`h-full rounded-full ${member.workload > 90 ? 'bg-gradient-to-r from-danger to-orange-600' : 'bg-gradient-to-r from-primary to-violet-600'}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-widest font-bold">
                                                <Target className="h-3.5 w-3.5 text-violet-500" />
                                                Compétences
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {member.skills.map(skill => (
                                                    <span
                                                        key={skill}
                                                        className="text-xs font-semibold bg-surface-hover text-text-muted px-3 py-1.5 rounded-xl border border-border-subtle hover:border-primary/30 hover:text-primary transition-colors"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
                                            <div className="glass-dark p-3 rounded-2xl text-center border border-border-subtle">
                                                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                                    <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                                                    <p className="text-[10px] text-text-subtle uppercase tracking-widest font-bold">Performance</p>
                                                </div>
                                                <div className="text-2xl font-black text-white">{member.performance}%</div>
                                            </div>
                                            <div className="glass-dark p-3 rounded-2xl text-center border border-border-subtle">
                                                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-violet-500" />
                                                    <p className="text-[10px] text-text-subtle uppercase tracking-widest font-bold">Projets</p>
                                                </div>
                                                <div className="text-2xl font-black text-white">{member.projects}</div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Button variant="outline" className="flex-1 h-11 text-sm border-border" onClick={() => toast.success(`Message sent to ${member.name}`)}>
                                                <Mail className="h-4 w-4 mr-2" /> Message
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-surface/60 backdrop-blur-xl border border-border rounded-3xl overflow-hidden"
                    >
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-surface/80 text-xs font-bold text-text-subtle uppercase tracking-wider">
                            <div className="col-span-4 pl-4">Membre</div>
                            <div className="col-span-2">Statut</div>
                            <div className="col-span-3">Charge</div>
                            <div className="col-span-2">Performance</div>
                            <div className="col-span-1 text-right pr-4">Actions</div>
                        </div>
                        <div className="divide-y divide-border-subtle">
                            {filteredTeam.map((member, idx) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                                >
                                    <div className="col-span-4 pl-4 flex items-center gap-4">
                                        <Avatar fallback={member.avatar} className="h-10 w-10 ring-2 ring-surface-elevated" />
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{member.name}</h4>
                                            <p className="text-xs text-text-subtle">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Badge variant={member.status === 'Available' ? 'success' : 'warning'}>
                                            {member.status === 'Available' ? 'Disponible' : 'Occupé'}
                                        </Badge>
                                    </div>
                                    <div className="col-span-3 pr-8">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold ${member.workload > 90 ? 'text-danger' : 'text-primary'}`}>{member.workload}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${member.workload > 90 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${member.workload}%` }} />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-1 font-bold text-white">
                                            <Star className="h-3 w-3 text-primary fill-primary" />
                                            {member.performance}%
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-right pr-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toast.success(`Message to ${member.name}`)}>Message</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toast.info(`Profile: ${member.name}`)}>Voir Profil</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {filteredTeam.length === 0 && (
                <div className="h-60 rounded-3xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center gap-4 text-text-subtle">
                    <Search className="h-10 w-10 opacity-20" />
                    <p className="text-lg font-medium">Aucun membre ne correspond à votre recherche</p>
                    <Button variant="ghost" className="text-primary" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
                        Réinitialiser les filtres
                    </Button>
                </div>
            )}

            {/* Add Member Modal */}
            <Modal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                title="Ajouter un membre"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsAddMemberModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="primary" onClick={handleAddMember}>
                            Ajouter le membre
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <Input label="Nom complet" placeholder="Ex: Jean Dupont" />
                    <Input label="Rôle" placeholder="Ex: Développeur Frontend" />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Compétences</label>
                        <Input placeholder="Ex: React, Node.js, Design (séparées par virgules)" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Statut</label>
                        <Select
                            value="Available"
                            onChange={() => { }}
                            options={[
                                { value: 'Available', label: 'Disponible' },
                                { value: 'Busy', label: 'Occupé' },
                            ]}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
