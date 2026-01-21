import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Check, AlertTriangle, FileText, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    title: string;
    description: string;
    created_at: string;
    type: string;
    category: string;
    is_read: boolean;
}

export function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string, category: string) => {
        if (category === 'project') return FileText;
        if (category === 'team') return UserPlus;
        if (category === 'finance') return Check;
        if (type === 'danger') return AlertTriangle;
        return Bell;
    }

    const getIconColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-emerald-500 bg-emerald-500/10';
            case 'danger': return 'text-rose-500 bg-rose-500/10';
            case 'warning': return 'text-amber-500 bg-amber-500/10';
            case 'info': return 'text-blue-500 bg-blue-500/10';
            default: return 'text-primary bg-primary/10';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.is_read;
        return n.category === filter;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-white mb-1">Notifications</h2>
                    <p className="text-text-muted">Restez informé de l'activité de l'agence</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Check className="h-4 w-4" />}>
                        Tout marquer comme lu
                    </Button>
                    <Button variant="ghost" size="sm" className="text-text-muted hover:text-white">
                        <Trash2 className="h-4 w-4 mr-2" /> Effacer lues
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="glass-panel p-2 flex gap-2">
                {['all', 'unread', 'project', 'finance', 'system'].map((f) => (
                    <Button
                        key={f}
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter(f)}
                        className={`capitalize rounded-lg ${filter === f ? 'bg-surface-hover text-white' : 'text-text-muted hover:text-white'}`}
                    >
                        {f === 'all' ? 'Toutes' : f}
                    </Button>
                ))}
            </Card>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredNotifications.map((n, idx) => {
                            const Icon = getIcon(n.type, n.category);
                            return (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className={`group flex items-start gap-4 p-5 transition-all hover:border-primary/30 ${!n.is_read ? 'bg-surface-elevated/80 border-l-4 border-l-primary' : 'glass opacity-80'}`}>
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(n.type)}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={`text-base font-bold ${!n.is_read ? 'text-white' : 'text-text-secondary'}`}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-xs text-text-subtle whitespace-nowrap ml-4">
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-muted mb-2">
                                                {n.description}
                                            </p>
                                            <div className="flex gap-2">
                                                {n.category === 'project' && <Button size="sm" variant="outline" className="h-7 text-xs">Voir le projet</Button>}
                                                {n.category === 'finance' && <Button size="sm" variant="outline" className="h-7 text-xs">Voir la facture</Button>}
                                            </div>
                                        </div>
                                        {!n.is_read && (
                                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                                        )}
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

// Remove default export to avoid conflict if any (though we used export function above)
const NotificationsPage = Notifications;
export default NotificationsPage;
