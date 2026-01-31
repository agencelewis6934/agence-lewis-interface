import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KpiCardProps {
    title: string;
    value: string;
    trend?: string;
    trendType?: 'up' | 'down';
    icon?: React.ReactNode;
    subtitle?: string;
    className?: string;
    delay?: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({
    title,
    value,
    trend,
    trendType = 'up',
    icon,
    subtitle,
    className,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="h-full"
        >
            <Card className={cn("bg-surface bg-opacity-40 backdrop-blur-xl border-border/50 h-full hover:border-primary/30 transition-all duration-300", className)}>
                <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium text-text-muted">{title}</span>
                        {icon && (
                            <div className="p-2 rounded-lg bg-surface-hover text-text-muted">
                                {icon}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>

                        <div className="flex items-center gap-2">
                            {trend && (
                                <div className={cn(
                                    "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                                    trendType === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-danger/10 text-danger"
                                )}>
                                    {trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {trend}
                                </div>
                            )}
                            {subtitle && (
                                <span className="text-xs text-text-subtle">{subtitle}</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
