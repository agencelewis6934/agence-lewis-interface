import React from 'react';
import { Search, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
    const location = useLocation();

    // Only show search bar on Projects and Clients pages
    const showSearchBar = location.pathname === '/projects' || location.pathname === '/clients';

    return (
        <header className="sticky top-0 z-40 h-[70px] border-b border-border bg-surface/80 px-8 backdrop-blur-md flex items-center">
            <div className="flex w-full max-w-[1600px] mx-auto items-center justify-between">
                {showSearchBar ? (
                    <div className="w-[400px]">
                        <Input
                            placeholder="Search projects, clients..."
                            leftIcon={<Search size={18} />}
                            className="rounded-full bg-surface-elevated border-transparent focus:border-primary"
                        />
                    </div>
                ) : (
                    // Empty div to maintain layout
                    <div />
                )}

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => toast.info("Aucune nouvelle notification")}>
                        <Bell size={20} />
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => toast.success("Creation de projet bientôt disponible !")}>
                        + New Project
                    </Button>
                </div>
            </div>
        </header>
    );
};
