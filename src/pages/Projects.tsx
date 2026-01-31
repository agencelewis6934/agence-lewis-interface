import { useState, useMemo } from 'react';
import { LayoutGrid, List, Plus, Clock, MoreHorizontal, Flame, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/Dropdown';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const columns = [
    { id: 'todo', title: 'À Faire', count: 0, color: 'from-gray-500 to-gray-600' },
    { id: 'in-progress', title: 'En Cours', count: 0, color: 'from-blue-500 to-cyan-600' },
    { id: 'review', title: 'En Révision', count: 0, color: 'from-amber-500 to-orange-600' },
    { id: 'done', title: 'Terminé', count: 0, color: 'from-emerald-500 to-teal-600' },
];

// Projects will be loaded from database or created by user
const projects: any[] = [];


export function Projects() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [projectForm, setProjectForm] = useState({
        name: '',
        client: '',
        deadline: '',
        priority: 'medium',
        description: ''
    });

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
            const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [searchQuery, filterStatus, filterPriority]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectForm.name || !projectForm.client) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            // Create calendar event if deadline is provided
            if (projectForm.deadline && user) {
                const deadlineDate = new Date(projectForm.deadline);
                // Set to end of day for all-day event
                deadlineDate.setHours(23, 59, 59, 999);

                const startDate = new Date(projectForm.deadline);
                startDate.setHours(0, 0, 0, 0);

                const { error: calendarError } = await supabase
                    .from('calendar_events')
                    .insert({
                        title: `📋 Deadline: ${projectForm.name}`,
                        description: `Projet: ${projectForm.name}\nClient: ${projectForm.client}\n\n${projectForm.description || 'Pas de description'}`,
                        category: 'task',
                        start_at: startDate.toISOString(),
                        end_at: deadlineDate.toISOString(),
                        all_day: true,
                        created_by: user.id
                    });

                if (calendarError) {
                    console.error('Error creating calendar event:', calendarError);
                    toast.error('Projet créé mais erreur lors de l\'ajout au calendrier');
                } else {
                    toast.success('Projet créé et ajouté au calendrier ! 📅');
                }
            } else {
                toast.success('Projet créé avec succès !');
            }

            // Reset form and close modal
            setProjectForm({
                name: '',
                client: '',
                deadline: '',
                priority: 'medium',
                description: ''
            });
            setIsCreateModalOpen(false);
        } catch (error: any) {
            console.error('Error creating project:', error);
            toast.error('Erreur lors de la création du projet');
        }
    };

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
                                Projets & Tâches
                            </span>
                        </h2>
                        <p className="text-text-muted text-lg">
                            Gérez vos projets en cours et collaborez avec l'équipe
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nouveau Projet
                        </Button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-surface/30 backdrop-blur-xl">
                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                        <div className="w-full max-w-sm">
                            <Input
                                placeholder="Rechercher un projet..."
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
                                { value: 'todo', label: 'À Faire' },
                                { value: 'in-progress', label: 'En Cours' },
                                { value: 'review', label: 'En Révision' },
                                { value: 'done', label: 'Terminé' },
                            ]}
                            className="w-48"
                        />
                        <Select
                            value={filterPriority}
                            onChange={setFilterPriority}
                            options={[
                                { value: 'all', label: 'Toutes priorités' },
                                { value: 'high', label: 'Haute' },
                                { value: 'medium', label: 'Moyenne' },
                                { value: 'low', label: 'Basse' },
                            ]}
                            className="w-40"
                        />
                    </div>

                    <div className="glass-dark p-1 rounded-xl border border-border flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('kanban')}
                            className={`h-9 px-4 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary/20 text-primary' : 'text-text-subtle'}`}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" /> Kanban
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

            {/* Content */}
            <AnimatePresence mode="wait">
                {viewMode === 'kanban' ? (
                    <motion.div
                        key="kanban"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-6 lg:grid-cols-4 overflow-x-auto pb-4"
                    >
                        {columns.map((column, colIdx) => {
                            const columnProjects = filteredProjects.filter(p => p.status === column.id);
                            return (
                                <motion.div
                                    key={column.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + colIdx * 0.05 }}
                                    className="min-w-[300px] flex flex-col gap-4"
                                >
                                    {/* Column Header */}
                                    <div className="glass-dark rounded-2xl p-4 flex items-center justify-between border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${column.color} shadow-lg`} />
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                                {column.title}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r ${column.color} bg-clip-text text-transparent ring-1 ring-inset`}
                                                style={{ WebkitTextFillColor: 'transparent' }}>
                                                {columnProjects.length}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-subtle hover:text-primary hover:bg-primary/10">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Project Cards */}
                                    <div className="flex-1 space-y-4">
                                        {columnProjects.map((project, idx) => (
                                            <motion.div
                                                key={project.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 + colIdx * 0.05 + idx * 0.05 }}
                                            >
                                                <Card
                                                    hoverable
                                                    className="group cursor-grab active:cursor-grabbing border-border-subtle hover:border-primary/30 bg-opacity-60 backdrop-blur-md"
                                                >
                                                    <CardContent className="p-5 space-y-4">
                                                        {/* Priority & Actions */}
                                                        <div className="flex items-start justify-between">
                                                            <Badge
                                                                variant={project.priority === 'high' ? 'error' : 'warning'}
                                                                className="text-[10px] h-6 px-2.5"
                                                            >
                                                                {project.priority === 'high' && <Flame className="h-3 w-3 mr-1" />}
                                                                {project.priority.toUpperCase()}
                                                            </Badge>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56">
                                                                    <DropdownMenuItem icon={<Eye className="h-4 w-4" />} onClick={() => toast.info(`Viewing details for ${project.title}`)}>
                                                                        Voir les détails
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem icon={<Pencil className="h-4 w-4" />} onClick={() => toast.success(`Editing ${project.title}`)}>
                                                                        Modifier le projet
                                                                    </DropdownMenuItem>
                                                                    <div className="h-px bg-border-subtle my-1" />
                                                                    <DropdownMenuItem
                                                                        destructive
                                                                        icon={<Trash2 className="h-4 w-4" />}
                                                                        onClick={() => toast.error(`Deleted ${project.title}`)}
                                                                    >
                                                                        Supprimer le projet
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        {/* Project Info */}
                                                        <div className="space-y-2">
                                                            <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors leading-snug">
                                                                {project.title}
                                                            </h4>
                                                            <p className="text-xs text-text-subtle font-medium">{project.client}</p>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-text-subtle font-semibold">Progression</span>
                                                                <span className="text-primary font-bold">{project.progress}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${project.progress}%` }}
                                                                    transition={{ delay: 0.5 + colIdx * 0.05 + idx * 0.05, duration: 0.8 }}
                                                                    className={`h-full rounded-full bg-gradient-to-r ${column.color}`}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Tags */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {project.tags.map(tag => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-[10px] font-bold bg-surface-hover text-text-muted px-2.5 py-1 rounded-lg border border-border-subtle uppercase tracking-wider"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="pt-3 flex items-center justify-between border-t border-border-subtle">
                                                            <div className="flex -space-x-2.5">
                                                                {project.team.map((m, i) => (
                                                                    <Avatar
                                                                        key={i}
                                                                        fallback={m}
                                                                        className="h-7 w-7 text-[10px] ring-2 ring-surface-elevated group-hover:ring-surface transition-all"
                                                                    />
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-text-subtle">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                                                    <Clock className="h-3.5 w-3.5" /> {project.deadline}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}

                                        {columnProjects.length === 0 && (
                                            <div className="h-40 rounded-3xl border-2 border-dashed border-border-subtle flex items-center justify-center text-text-subtle text-sm italic">
                                                Aucun projet
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
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
                            <div className="col-span-4 pl-4">Projet</div>
                            <div className="col-span-2">Statut</div>
                            <div className="col-span-2">Priorité</div>
                            <div className="col-span-2">Équipe</div>
                            <div className="col-span-2 text-right pr-4">Deadline</div>
                        </div>
                        <div className="divide-y divide-border-subtle">
                            {filteredProjects.map((project, idx) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                                >
                                    <div className="col-span-4 pl-4 flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${columns.find(c => c.id === project.status)?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold`}>
                                            {project.title.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{project.title}</h4>
                                            <p className="text-xs text-text-subtle">{project.client}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Badge variant={project.status === 'done' ? 'success' : project.status === 'in-progress' ? 'info' : 'warning'}>
                                            {columns.find(c => c.id === project.status)?.title}
                                        </Badge>
                                    </div>
                                    <div className="col-span-2">
                                        <Badge
                                            variant={project.priority === 'high' ? 'error' : 'warning'}
                                            className="text-[10px]"
                                        >
                                            {project.priority.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="col-span-2 flex -space-x-2">
                                        {project.team.map((m, i) => (
                                            <Avatar
                                                key={i}
                                                fallback={m}
                                                className="h-8 w-8 text-xs ring-2 ring-surface-elevated group-hover:ring-surface transition-all"
                                            />
                                        ))}
                                    </div>
                                    <div className="col-span-2 text-right pr-4 text-sm text-text-subtle">
                                        {project.deadline}
                                    </div>
                                </motion.div>
                            ))}
                            {filteredProjects.length === 0 && (
                                <div className="p-12 text-center text-text-subtle italic">
                                    Aucun projet ne correspond à votre recherche.
                                </div>
                            )}
                        </div>
                    </motion.div >
                )
                }
            </AnimatePresence >

            {/* Create Project Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Créer un nouveau projet"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="primary" onClick={handleCreateProject}>
                            Créer le projet
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nom du projet"
                        placeholder="Ex: Refonte Site Web"
                        value={projectForm.name}
                        onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Client"
                        placeholder="Ex: Acme Corp"
                        value={projectForm.client}
                        onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">
                                Date limite <span className="text-xs text-text-subtle">(optionnel - sera ajouté au calendrier)</span>
                            </label>
                            <Input
                                type="date"
                                value={projectForm.deadline}
                                onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Priorité</label>
                            <Select
                                value={projectForm.priority}
                                onChange={(value) => setProjectForm({ ...projectForm, priority: value })}
                                options={[
                                    { value: 'high', label: 'Haute' },
                                    { value: 'medium', label: 'Moyenne' },
                                    { value: 'low', label: 'Basse' },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Description</label>
                        <textarea
                            className="w-full h-24 bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none transition-all"
                            placeholder="Description du projet..."
                            value={projectForm.description}
                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div >
    );
}
