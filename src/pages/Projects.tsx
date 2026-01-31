import { useState, useEffect } from 'react';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    closestCenter,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const columns = [
    { id: 'todo', title: 'À Faire', color: 'from-gray-500 to-gray-600' },
    { id: 'in-progress', title: 'En Cours', color: 'from-blue-500 to-cyan-600' },
    { id: 'review', title: 'En Révision', color: 'from-amber-500 to-orange-600' },
    { id: 'done', title: 'Terminé', color: 'from-emerald-500 to-teal-600' },
];

// Draggable Project Card Component
function DraggableProjectCard({ project }: { project: any }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: project.id,
        data: { project },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
            className="p-4 bg-surface-elevated rounded-xl border border-border hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing"
        >
            <h4 className="font-semibold text-white mb-2">{project.name}</h4>
            {project.clients && (
                <p className="text-xs text-text-muted">
                    {project.clients.name}
                    {project.clients.company && ` - ${project.clients.company}`}
                </p>
            )}
            {project.price && (
                <p className="text-sm font-bold text-primary mt-2">
                    {project.price} €
                </p>
            )}
            {project.priority && (
                <Badge
                    variant={
                        project.priority === 'high' ? 'destructive' :
                            project.priority === 'medium' ? 'warning' : 'neutral'
                    }
                    className="mt-2"
                >
                    {project.priority === 'high' ? 'Haute' :
                        project.priority === 'medium' ? 'Moyenne' : 'Basse'}
                </Badge>
            )}
        </motion.div>
    );
}

// Droppable Column Component
function DroppableColumn({ column, children }: { column: any; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`transition-all ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
        >
            {children}
        </div>
    );
}

export function Projects() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [activeId, setActiveId] = useState<string | null>(null);

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        })
    );

    // Load projects from Supabase
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    clients (
                        id,
                        name,
                        company,
                        avatar
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error loading projects:', error);
            toast.error('Erreur lors du chargement des projets');
        } finally {
            setLoading(false);
        }
    };

    // Update project status in Supabase
    const updateProjectStatus = async (projectId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('projects')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', projectId);

            if (error) throw error;

            // Update local state
            setProjects(prevProjects =>
                prevProjects.map(p =>
                    p.id === projectId ? { ...p, status: newStatus } : p
                )
            );

            toast.success('Projet déplacé avec succès');
            return true;
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error('Erreur lors de la mise à jour du projet');
            return false;
        }
    };

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const projectId = active.id as string;
        const newStatus = over.id as string;

        // Find the project being dragged
        const project = projects.find(p => p.id === projectId);

        if (project && project.status !== newStatus) {
            await updateProjectStatus(projectId, newStatus);
        }

        setActiveId(null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    // Calculate column counts
    const getColumnProjects = (columnId: string) => {
        return projects.filter(p => p.status === columnId);
    };

    // Get active project for drag overlay
    const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

    return (
        <div className="space-y-8 pb-12">
            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadProjects}
            />

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
                        />
                        <Select
                            value={filterPriority}
                            onChange={setFilterPriority}
                            options={[
                                { value: 'all', label: 'Toutes priorités' },
                                { value: 'low', label: 'Basse' },
                                { value: 'medium', label: 'Moyenne' },
                                { value: 'high', label: 'Haute' },
                            ]}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-surface-elevated rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Kanban Board */}
            {viewMode === 'kanban' && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {columns.map((column, idx) => {
                            const columnProjects = getColumnProjects(column.id);
                            return (
                                <motion.div
                                    key={column.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <DroppableColumn column={column}>
                                        <Card className="h-full">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className={`h-2 w-full rounded-full bg-gradient-to-r ${column.color} shadow-lg`} />
                                                </div>
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className={`text-sm font-black bg-gradient-to-r ${column.color} bg-clip-text text-transparent ring-1 ring-inset`}>
                                                            {column.title}
                                                        </h3>
                                                        <Badge variant="neutral" className="text-xs">
                                                            {columnProjects.length}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {columnProjects.length === 0 ? (
                                                    <div className="text-center py-8 text-text-muted text-sm">
                                                        Aucun projet
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {columnProjects.map((project) => (
                                                            <DraggableProjectCard key={project.id} project={project} />
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </DroppableColumn>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeProject ? (
                            <div className="p-4 bg-surface-elevated rounded-xl border border-primary shadow-2xl opacity-90">
                                <h4 className="font-semibold text-white mb-2">{activeProject.name}</h4>
                                {activeProject.clients && (
                                    <p className="text-xs text-text-muted">
                                        {activeProject.clients.name}
                                        {activeProject.clients.company && ` - ${activeProject.clients.company}`}
                                    </p>
                                )}
                                {activeProject.price && (
                                    <p className="text-sm font-bold text-primary mt-2">
                                        {activeProject.price} €
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-text-muted">Chargement des projets...</div>
                </div>
            )}
        </div>
    );
}
