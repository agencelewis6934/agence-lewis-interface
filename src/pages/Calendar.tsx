import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type DateClickArg, type EventResizeDoneArg } from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule'; // Import RRule plugin
import { type EventClickArg, type EventDropArg } from '@fullcalendar/core';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { type CalendarEvent, type CalendarView } from '../types/calendar';
import { EventModal } from '../components/calendar/EventModal';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Calendar() {
    const { user } = useAuth();
    const calendarRef = useRef<FullCalendar>(null);
    const [view, setView] = useState<CalendarView>('dayGridMonth');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        eventId: string | null;
        eventTitle: string;
    }>({
        isOpen: false,
        eventId: null,
        eventTitle: '',
    });

    // ... (fetchEvents and useEffect remain same) ...

    // Fetch events from Supabase
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .order('start_at', { ascending: true });

            if (error) throw error;

            setEvents(data || []);
        } catch (error: any) {
            console.error('[Calendar] Error fetching events:', error);
            toast.error('Erreur lors du chargement des événements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('calendar_events_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'calendar_events' },
                () => {
                    console.log('[Calendar] Real-time update detected');
                    fetchEvents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // ... (Handlers remain same) ...

    // Handle date click (create new event)
    const handleDateClick = (info: DateClickArg) => {
        setSelectedDate(info.date);
        setSelectedEvent(null);
        setShowModal(true);
    };

    // Handle event click (edit event)
    const handleEventClick = (info: EventClickArg) => {
        // If it's a recurring event instance, info.event.id might be same
        // But we need to find the original event from our state
        const eventId = info.event.id;
        const event = events.find(e => e.id === eventId);

        if (event) {
            setSelectedEvent(event);
            setSelectedDate(null);
            setShowModal(true);
        }
    };

    // Handle event drag (move event)
    const handleEventDrop = async (info: EventDropArg) => {
        const event = events.find(e => e.id === info.event.id);
        if (!event) return;

        // If recurring, we might want to update the whole series start_at
        // For MVP, updating recurrence start is simple
        // If user drags ONE instance, usually we ask "This event" or "All events".
        // For MVP, we'll update the MAIN event start_at, which shifts the whole series.

        const duration = new Date(event.end_at).getTime() - new Date(event.start_at).getTime();
        const newStart = info.event.start!;
        // Ensure we keep the duration consistent
        const newEnd = new Date(newStart.getTime() + duration);

        try {
            const { error } = await supabase
                .from('calendar_events')
                .update({
                    start_at: newStart.toISOString(),
                    end_at: newEnd.toISOString(),
                })
                .eq('id', event.id);

            if (error) throw error;

            toast.success('Événement déplacé');
        } catch (error: any) {
            console.error('[Calendar] Error updating event:', error);
            toast.error('Erreur lors du déplacement');
            info.revert();
        }
    };

    // Handle event resize (change duration)
    const handleEventResize = async (info: EventResizeDoneArg) => {
        const event = events.find(e => e.id === info.event.id);
        if (!event) return;

        try {
            // Calculate new duration and apply to end_at
            // Wait, for recurring events, resize changes the duration of ALL instances?
            // Yes, typically.
            const { error } = await supabase
                .from('calendar_events')
                .update({
                    // start_at: info.event.start!.toISOString(), // Usually start doesn't change on resize from end
                    end_at: info.event.end!.toISOString(),
                })
                .eq('id', event.id);

            if (error) throw error;

            toast.success('Durée modifiée');
        } catch (error: any) {
            console.error('[Calendar] Error resizing event:', error);
            toast.error('Erreur lors de la modification');
            info.revert();
        }
    };

    // ... (rest is unchanged until return) ...
    // Handle event deletion
    const handleDeleteEvent = async () => {
        if (!deleteConfirm.eventId) return;

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', deleteConfirm.eventId);

            if (error) throw error;

            toast.success('Événement supprimé');
            fetchEvents();
            setDeleteConfirm({ isOpen: false, eventId: null, eventTitle: '' });
        } catch (error: any) {
            console.error('[Calendar] Error deleting event:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    // Change calendar view (unchanged)
    const changeView = (newView: CalendarView) => {
        setView(newView);
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(newView);
        }
    };

    // Get category color (unchanged)
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'call': return '#3b82f6'; // blue
            case 'meeting': return '#8b5cf6'; // purple
            case 'task': return '#10b981'; // green
            case 'event': return '#f59e0b'; // orange
            default: return '#6b7280'; // gray
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-background p-6">
            {/* Header ... */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-white">Calendrier</h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant={view === 'dayGridMonth' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => changeView('dayGridMonth')}
                        >
                            Mois
                        </Button>
                        <Button
                            variant={view === 'timeGridWeek' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => changeView('timeGridWeek')}
                        >
                            Semaine
                        </Button>
                        <Button
                            variant={view === 'timeGridDay' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => changeView('timeGridDay')}
                        >
                            Jour
                        </Button>
                        <Button
                            variant={view === 'listWeek' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => changeView('listWeek')}
                        >
                            Agenda
                        </Button>
                    </div>

                    {/* New Event Button */}
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setSelectedEvent(null);
                            setSelectedDate(new Date());
                            setShowModal(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel événement
                    </Button>
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 bg-surface rounded-lg border border-border p-4 overflow-hidden">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, rrulePlugin]}
                    initialView={view}
                    events={events.map(e => {
                        const baseEvent = {
                            id: e.id,
                            title: e.title,
                            backgroundColor: getCategoryColor(e.category),
                            borderColor: getCategoryColor(e.category),
                            allDay: e.all_day,
                        };

                        if (e.recurrence) {
                            return {
                                ...baseEvent,
                                rrule: {
                                    freq: e.recurrence, // 'daily', 'weekly', 'monthly' matches RRule strings directly (lowercase is fine for plugin)
                                    dtstart: e.start_at,

                                },
                                // Duration is required for recurring events to have correct end time per instance
                                duration: new Date(e.end_at).getTime() - new Date(e.start_at).getTime()
                            };
                        }

                        return {
                            ...baseEvent,
                            start: e.start_at,
                            end: e.end_at,
                        };
                    })}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: ''
                    }}
                    height="100%"
                    locale="fr"
                    buttonText={{
                        today: "Aujourd'hui",
                        month: 'Mois',
                        week: 'Semaine',
                        day: 'Jour',
                        list: 'Agenda'
                    }}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    allDaySlot={true}
                />
            </div>
            {/* ... Modal and ConfirmDialog remain same ... */}
            {/* Event Modal */}
            {showModal && (
                <EventModal
                    event={selectedEvent}
                    initialDate={selectedDate}
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedEvent(null);
                        setSelectedDate(null);
                    }}
                    onSave={() => {
                        fetchEvents();
                        setShowModal(false);
                        setSelectedEvent(null);
                        setSelectedDate(null);
                    }}
                    onDelete={(event) => {
                        setDeleteConfirm({
                            isOpen: true,
                            eventId: event.id,
                            eventTitle: event.title,
                        });
                        setShowModal(false);
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, eventId: null, eventTitle: '' })}
                onConfirm={handleDeleteEvent}
                title="Supprimer l'événement"
                message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirm.eventTitle}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                destructive={true}
            />
        </div>
    );
}
