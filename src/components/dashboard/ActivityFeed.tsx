import React from 'react';
import { Bell, UserPlus, ShoppingCart, Wallet, CheckCircle2, MoreVertical } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

const notifications = [
    { id: 1, title: '56 nouveaux clients enregistrés', time: 'Il y a 59 minutes', icon: <UserPlus className="h-4 w-4 text-emerald-500" />, color: 'emerald' },
    { id: 2, title: '132 commandes passées', time: 'Il y a 12 heures', icon: <ShoppingCart className="h-4 w-4 text-primary" />, color: 'primary' },
    { id: 3, title: 'Fonds retirés', time: 'Il y a 15 heures', icon: <Wallet className="h-4 w-4 text-amber-500" />, color: 'amber' },
    { id: 4, title: '5 messages non lus', time: 'Aujourd\'hui, 11:59', icon: <Bell className="h-4 w-4 text-blue-500" />, color: 'blue' },
];

const activities = [
    { user: 'S. Jean', action: 'A modifié le style', time: 'À l\'instant', avatar: 'SJ' },
    { user: 'M. Rose', action: 'A ajouté 17 produits', time: 'Il y a 47 minutes', avatar: 'MR' },
    { user: 'P. Lucas', action: 'A archivé 11 documents', time: 'Il y a 1 jour', avatar: 'PL' },
];

export const ActivityFeed: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* Notifications Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight">Notifications</h3>
                    <MoreVertical size={16} className="text-text-muted cursor-pointer" />
                </div>
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div key={notif.id} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                            <div className="h-10 w-10 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0 group-hover:bg-surface-elevated transition-colors border border-border/10">
                                {notif.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{notif.title}</span>
                                <span className="text-[11px] text-text-subtle font-medium">{notif.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activities Section */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-12">
                    <h3 className="text-xl font-bold text-white tracking-tight">Activités</h3>
                    <MoreVertical size={16} className="text-text-muted cursor-pointer" />
                </div>
                <div className="space-y-6">
                    {activities.map((activity, idx) => (
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
                    ))}
                </div>
            </div>

            {/* Account Managers Section (Simplified) */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-12">
                    <h3 className="text-xl font-bold text-white tracking-tight">Gestionnaires</h3>
                    <MoreVertical size={16} className="text-text-muted cursor-pointer" />
                </div>
                <div className="space-y-4">
                    {['Daniel Craig', 'Kate Morrison', 'Nataniel Donovan'].map((name, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${idx === 2 ? 'bg-primary/10 border border-primary/20 ring-1 ring-primary/30' : 'hover:bg-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center text-[10px] font-bold text-white border border-border/10">
                                    {name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className={`text-xs font-bold ${idx === 2 ? 'text-white' : 'text-text-muted'}`}>{name}</span>
                            </div>
                            {idx === 2 && <CheckCircle2 size={14} className="text-primary" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
