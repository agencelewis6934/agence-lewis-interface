import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Settings, Briefcase, Bell, Inbox, MessageSquare, Calendar, FileText, CheckSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
    const { user } = useAuth();

    // Get user's display name from metadata or email
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    // Get initials for avatar
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-border bg-surface p-6 text-text-main">
            <div className="mb-6 flex items-center justify-center">
                <img
                    src="/logo.png"
                    alt="Agence Lewis Logo"
                    className="w-full h-auto object-contain"
                />
            </div>

            <div className="mb-8">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Menu</div>
                <nav className="flex flex-col gap-1">
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Overview" />
                    <NavItem to="/projects" icon={<FolderKanban size={20} />} label="Projects" />
                    <NavItem to="/tasks" icon={<CheckSquare size={20} />} label="Tâches" />
                    <NavItem to="/clients" icon={<Briefcase size={20} />} label="Clients" />
                    <NavItem to="/team" icon={<Users size={20} />} label="Team" />
                </nav>
            </div>

            <div className="mb-8">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">General</div>
                <nav className="flex flex-col gap-1">
                    <NavItem to="/inbox" icon={<Inbox size={20} />} label="Inbox" badge="2" />
                    <NavItem to="/chat" icon={<MessageSquare size={20} />} label="Chat" />
                    <NavItem to="/calendar" icon={<Calendar size={20} />} label="Calendrier" />
                    <NavItem to="/documents" icon={<FileText size={20} />} label="Documents" />
                    <NavItem to="/notifications" icon={<Bell size={20} />} label="Alerts" />
                    <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
                </nav>
            </div>

            <div className="mt-auto border-t border-border pt-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                        {initials}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{displayName}</span>
                        <span className="text-[11px] text-text-muted">Co-founder</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    badge?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => (
    <NavLink
        to={to}
        className={({ isActive }) => cn(
            "relative flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
            isActive
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:bg-surface-hover hover:text-white"
        )}
    >
        {icon}
        <span>{label}</span>
        {badge && (
            <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {badge}
            </span>
        )}
    </NavLink>
);
