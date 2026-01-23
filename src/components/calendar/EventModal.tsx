import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { type CalendarEvent, type EventFormData } from '../../types/calendar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Calendar, Clock, MapPin, Video, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EventModalProps {
    event: CalendarEvent | null;
    initialDate?: Date | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function EventModal({ event, initialDate, isOpen, onClose, onSave }: EventModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        location: '',
        video_link: '',
        category: 'meeting',
        start_at: new Date(),
        end_at: new Date(Date.now() + 60 * 60 * 1000), // +1 hour
        all_day: false,
    });

    useEffect(() => {
        if (event) {
            // Edit mode
            setFormData({
                title: event.title,
                description: event.description || '',
                location: event.location || '',
                video_link: event.video_link || '',
                category: event.category,
                start_at: new Date(event.start_at),
                end_at: new Date(event.end_at),
                all_day: event.all_day,
            });
        } else if (initialDate) {
            // Create mode with initial date
            const start = new Date(initialDate);
            start.setHours(9, 0, 0, 0); // Default to 9 AM
            const end = new Date(start);
            end.setHours(10, 0, 0, 0); // Default to 10 AM

            setFormData({
                ...formData,
                start_at: start,
                end_at: end,
            });
        }
    }, [event, initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Le titre est obligatoire');
            return;
        }

        if (formData.end_at <= formData.start_at) {
            toast.error('La date de fin doit être après la date de début');
            return;
        }

        if (!user) {
            console.error('[EventModal] User not authenticated');
            toast.error('Vous devez être connecté pour créer un événement');
            return;
        }

        setLoading(true);

        try {
            const eventData: any = {
                title: formData.title.trim(),
                description: formData.description?.trim() || null,
                location: formData.location?.trim() || null,
                video_link: formData.video_link?.trim() || null,
                category: formData.category,
                start_at: formData.start_at.toISOString(),
                end_at: formData.end_at.toISOString(),
                all_day: formData.all_day,
            };

            // Only add created_by if user exists (for compatibility with mock auth)
            if (user?.id) {
                eventData.created_by = user.id;
            }

            console.log('[EventModal] Submitting event data:', eventData);

            if (event) {
                // Update existing event
                const { data, error } = await supabase
                    .from('calendar_events')
                    .update(eventData)
                    .eq('id', event.id)
                    .select();

                if (error) {
                    console.error('[EventModal] Update error:', error);
                    throw error;
                }
                console.log('[EventModal] Event updated:', data);
                toast.success('Événement modifié');
            } else {
                // Create new event
                const { data, error } = await supabase
                    .from('calendar_events')
                    .insert(eventData)
                    .select();

                if (error) {
                    console.error('[EventModal] Insert error:', error);
                    throw error;
                }
                console.log('[EventModal] Event created:', data);
                toast.success('Événement créé');
            }

            onSave();
        } catch (error: any) {
            console.error('[EventModal] Error saving event:', error);
            console.error('[EventModal] Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            toast.error(`Erreur: ${error.message || 'Erreur lors de l\'enregistrement'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event) return;

        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', event.id);

            if (error) throw error;

            toast.success('Événement supprimé');
            onSave();
        } catch (error: any) {
            console.error('[EventModal] Error deleting event:', error);
            toast.error('Erreur lors de la suppression');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-white">
                        {event ? 'Modifier l\'événement' : 'Nouvel événement'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Titre <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Réunion d'équipe"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Catégorie
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                        >
                            <option value="call">📞 Appel</option>
                            <option value="meeting">👥 Réunion</option>
                            <option value="task">✅ Tâche</option>
                            <option value="event">📅 Événement</option>
                        </select>
                    </div>

                    {/* All Day */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="all_day"
                            checked={formData.all_day}
                            onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                            className="h-4 w-4 rounded border-border bg-surface-elevated text-primary focus:ring-primary"
                        />
                        <label htmlFor="all_day" className="text-sm text-white cursor-pointer">
                            Toute la journée
                        </label>
                    </div>

                    {/* Start Date/Time */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formData.all_day ? 'Date de début' : 'Début'}
                        </label>
                        <input
                            type={formData.all_day ? 'date' : 'datetime-local'}
                            value={formData.all_day
                                ? formData.start_at.toISOString().split('T')[0]
                                : formatDateTimeLocal(formData.start_at)
                            }
                            onChange={(e) => setFormData({ ...formData, start_at: new Date(e.target.value) })}
                            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    {/* End Date/Time */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {formData.all_day ? 'Date de fin' : 'Fin'}
                        </label>
                        <input
                            type={formData.all_day ? 'date' : 'datetime-local'}
                            value={formData.all_day
                                ? formData.end_at.toISOString().split('T')[0]
                                : formatDateTimeLocal(formData.end_at)
                            }
                            onChange={(e) => setFormData({ ...formData, end_at: new Date(e.target.value) })}
                            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Détails de l'événement..."
                            rows={3}
                            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2 text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Lieu
                        </label>
                        <Input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ex: Salle de réunion A"
                        />
                    </div>

                    {/* Video Link */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Lien visio
                        </label>
                        <Input
                            type="url"
                            value={formData.video_link}
                            onChange={(e) => setFormData({ ...formData, video_link: e.target.value })}
                            placeholder="https://meet.google.com/..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div>
                            {event && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                            >
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
