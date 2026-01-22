// Calendar Event Types
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    video_link?: string | null;
    category: 'call' | 'meeting' | 'task' | 'event';
    start_at: string; // ISO 8601 timestamp
    end_at: string;   // ISO 8601 timestamp
    all_day: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface EventFormData {
    title: string;
    description?: string;
    location?: string;
    video_link?: string;
    category: 'call' | 'meeting' | 'task' | 'event';
    start_at: Date;
    end_at: Date;
    all_day: boolean;
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export interface EventModalProps {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    onDelete?: (id: string) => void;
}
