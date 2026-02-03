import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type CalendarEvent } from '../types/calendar';

export interface Notification {
    id: string;
    title: string;
    time: string;
    type: 'event' | 'deadline';
    link?: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // 1. Fetch upcoming projects (Deadlines)
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const dayAfterTomorrow = new Date(tomorrow);
                dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

                const { data: projects } = await supabase
                    .from('projects')
                    .select('id, name, deadline')
                    .not('deadline', 'is', null)
                    .or(`deadline.eq.${today.toISOString().split('T')[0]},deadline.eq.${tomorrow.toISOString().split('T')[0]}`);

                // 2. Fetch events with reminders
                const { data: events } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .gt('end_at', new Date().toISOString()) // Only future/current events
                    .order('start_at', { ascending: true });

                const notifs: Notification[] = [];

                // Process Projects
                projects?.forEach((p: any) => {
                    const deadline = new Date(p.deadline);
                    const isToday = deadline.getDate() === today.getDate();

                    notifs.push({
                        id: `proj-${p.id}`,
                        title: `Deadline: ${p.name}`,
                        time: isToday ? "Aujourd'hui" : "Demain",
                        type: 'deadline'
                    });
                });

                // Process Events
                const now = new Date();
                events?.forEach((e: CalendarEvent) => {
                    if (!e.reminder_minutes) return;

                    const start = new Date(e.start_at);
                    const reminderTime = new Date(start.getTime() - e.reminder_minutes * 60000);

                    // Show if we are within the window [Reminder Time, Start Time]
                    // And keep showing it until it starts

                    if (now >= reminderTime && now < start) {
                        const diffMinutes = Math.floor((start.getTime() - now.getTime()) / 60000);
                        let timeText = `Dans ${diffMinutes} min`;
                        if (diffMinutes > 60) timeText = `Dans ${Math.floor(diffMinutes / 60)}h`;
                        if (diffMinutes > 1440) timeText = `Demain`;
                        if (diffMinutes <= 0) timeText = 'Maintenant';

                        notifs.push({
                            id: `evt-${e.id}`,
                            title: `Rappel: ${e.title}`,
                            time: timeText,
                            type: 'event'
                        });
                    }
                });

                setNotifications(notifs);

            } catch (error) {
                console.error('[useNotifications] Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Refresh every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);

    }, []);

    return { notifications, loading };
}
