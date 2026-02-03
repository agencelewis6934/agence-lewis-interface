import React from 'react';
import { MoreVertical, Calendar, AlertCircle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useNotifications } from '../../hooks/useNotifications';

const activities: any[] = [];

export const ActivityFeed: React.FC = () => {
    const { notifications } = useNotifications();

    return (
        <div className="space-y-8">
            {/* Notifications Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight">Notifications</h3>
                    <MoreVertical size={16} className="text-text-muted cursor-pointer" />
                </div>
                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center py-4 text-text-muted text-sm italic">
                            Aucune notification
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border border-border/10 ${notif.type === 'deadline' ? 'bg-red-500/10' : 'bg-surface-hover group-hover:bg-surface-elevated'}`}>
                                    {notif.type === 'deadline' ? (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <Calendar className="h-5 w-5 text-primary" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{notif.title}</span>
                                    <span className="text-[11px] text-text-subtle font-medium">{notif.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Activities Section */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-12">
                    <h3 className="text-xl font-bold text-white tracking-tight">Activités</h3>
                    <MoreVertical size={16} className="text-text-muted cursor-pointer" />
                </div>
                <div className="space-y-6">
                    {activities.length === 0 ? (
                        <div className="text-center py-4 text-text-muted text-sm italic">
                            Aucune activité récente
                        </div>
                    ) : (
                        activities.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-4 cursor-pointer group">
                                <Avatar className="h-10 w-10 bg-surface-hover text-white text-xs font-bold border border-border/10 group-hover:border-primary/50 transition-colors" fallback={activity.avatar} />
                                <div className="flex flex-col pt-0.5">
                                    <p className="text-sm">
                                        <span className="font-bold text-white hover:text-primary transition-colors">{activity.user}</span>
                                        <span className="text-text-muted ml-1">{activity.action}</span>
                                    </p>
                                    <span className="text-[11px] text-text-subtle font-medium border-l border-primary pl-2 mt-1">{activity.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Account Managers Section (Simplified) */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-12">
                    <h3 className="text-xl font-bold text-white tracking-tight">Gestionnaires</h3>
                    <MoreVertical size={16} className="text-text-muted cursor-pointer" />
                </div>
                <div className="space-y-4">
                    <div className="text-center py-4 text-text-muted text-sm italic">
                        Aucun gestionnaire assigné
                    </div>
                </div>
            </div>
        </div>
    );
};
