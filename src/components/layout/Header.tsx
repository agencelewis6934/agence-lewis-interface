import React from 'react';
import { Search, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
    return (
        <header className="sticky top-0 z-40 h-[70px] border-b border-border bg-surface/80 px-8 backdrop-blur-md flex items-center">
            <div className="flex w-full max-w-[1600px] mx-auto items-center justify-between">
                <div className="w-[400px]">
                    <Input
                        placeholder="Search projects, clients..."
                        leftIcon={<Search size={18} />}
                        className="rounded-full bg-surface-elevated border-transparent focus:border-primary"
                    />
                </div>

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
