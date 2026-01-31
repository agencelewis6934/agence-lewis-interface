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
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
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

// Draggable Task Card Component
function DraggableTaskCard({ task }: { task: any }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
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
            <h4 className="font-semibold text-white mb-2">{task.title}</h4>
            {task.description && (
                <p className="text-xs text-text-muted mb-2 line-clamp-2">
                    {task.description}
                </p>
            )}
            {task.projects && (
                <p className="text-xs text-text-muted mb-2">
                    📁 {task.projects.name}
                </p>
            )}
            <div className="flex items-center justify-between mt-3">
                {task.deadline && (
                    <p className="text-xs text-text-muted">
                        📅 {new Date(task.deadline).toLocaleDateString('fr-FR')}
                    </p>
                )}
                {task.priority && (
                    <Badge
                        variant={
                            task.priority === 'high' ? 'destructive' :
                                task.priority === 'medium' ? 'warning' : 'neutral'
                        }
                    >
                        {task.priority === 'high' ? 'Haute' :
                            task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                )}
            </div>
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

export function Tasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        })
    );

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    projects (
                        id,
                        name
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (error: any) {
            console.error('Error loading tasks:', error);
            toast.error('Erreur lors du chargement des tâches');
        } finally {
            setLoading(false);
        }
    };

    // Update task status in Supabase
    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) throw error;

            // Update local state
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                )
            );

            toast.success('Tâche déplacée avec succès');
        } catch (error: any) {
            console.error('Error updating task status:', error);
            toast.error('Erreur lors de la mise à jour de la tâche');
        }
    };

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const taskId = active.id as string;
            const newStatus = over.id as string;

            // Update task status
            await updateTaskStatus(taskId, newStatus);
        }

        setActiveId(null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    // Get tasks for a specific column
    const getColumnTasks = (columnId: string) => {
        return tasks.filter(task => {
            const matchesStatus = task.status === columnId;
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (task.projects && task.projects.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

            return matchesStatus && matchesSearch && matchesPriority;
        });
    };

    // Get active task for drag overlay
    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <div className="space-y-8 pb-12">
            {/* Modal */}
            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadTasks}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-5xl font-bold tracking-tight mb-2">
                        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                            Tâches
                        </span>
                    </h2>
                    <p className="text-text-muted text-lg">
                        Gérez vos tâches et suivez leur progression
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setIsModalOpen(true)}
                    className="gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Nouvelle Tâche
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Rechercher une tâche..."
                                leftIcon={<Search className="h-4 w-4" />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'all', label: 'Tous les statuts' },
                                { value: 'todo', label: 'À Faire' },
                                { value: 'in-progress', label: 'En Cours' },
                                { value: 'review', label: 'En Révision' },
                                { value: 'done', label: 'Terminé' },
                            ]}
                            className="w-full md:w-48"
                        />
                        <Select
                            value={priorityFilter}
                            onChange={setPriorityFilter}
                            options={[
                                { value: 'all', label: 'Toutes priorités' },
                                { value: 'low', label: 'Basse' },
                                { value: 'medium', label: 'Moyenne' },
                                { value: 'high', label: 'Haute' },
                            ]}
                            className="w-full md:w-48"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'kanban' ? 'primary' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('kanban')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'primary' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                            const columnTasks = getColumnTasks(column.id);
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
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.color}`} />
                                                        <h3 className="font-semibold text-white">{column.title}</h3>
                                                    </div>
                                                    <span className="text-xs font-medium text-text-muted bg-surface-elevated px-2 py-1 rounded-full">
                                                        {columnTasks.length}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {columnTasks.length === 0 ? (
                                                    <div className="text-center py-8 text-text-muted text-sm">
                                                        Aucune tâche
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {columnTasks.map((task) => (
                                                            <DraggableTaskCard key={task.id} task={task} />
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
                        {activeTask ? (
                            <div className="p-4 bg-surface-elevated rounded-xl border border-primary shadow-2xl opacity-90">
                                <h4 className="font-semibold text-white mb-2">{activeTask.title}</h4>
                                {activeTask.description && (
                                    <p className="text-xs text-text-muted mb-2 line-clamp-2">
                                        {activeTask.description}
                                    </p>
                                )}
                                {activeTask.projects && (
                                    <p className="text-xs text-text-muted mb-2">
                                        📁 {activeTask.projects.name}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                    {activeTask.deadline && (
                                        <p className="text-xs text-text-muted">
                                            📅 {new Date(activeTask.deadline).toLocaleDateString('fr-FR')}
                                        </p>
                                    )}
                                    {activeTask.priority && (
                                        <Badge
                                            variant={
                                                activeTask.priority === 'high' ? 'destructive' :
                                                    activeTask.priority === 'medium' ? 'warning' : 'neutral'
                                            }
                                        >
                                            {activeTask.priority === 'high' ? 'Haute' :
                                                activeTask.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-text-muted">Chargement des tâches...</div>
                </div>
            )}
        </div>
    );
}
