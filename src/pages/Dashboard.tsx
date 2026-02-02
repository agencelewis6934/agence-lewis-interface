import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, FolderGit2, Activity, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SalesOverviewChart } from '../components/dashboard/SalesOverviewChart';
import { CustomerTable } from '../components/dashboard/CustomerTable';
import { ProfitTrendChart } from '../components/dashboard/ProfitTrendChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export const Dashboard: React.FC = () => {
    const { kpi, salesData, profitTrend, topClients, loading } = useDashboardMetrics();

    if (loading) {
        return <div className="p-8 text-center text-text-muted">Chargement du tableau de bord...</div>;
    }

    // Determine trend types based on data (mock logic or real)
    const revenueTrendType = kpi.revenueGrowth >= 0 ? 'up' : 'down';

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                            Tableau de bord
                        </span>
                    </h1>
                    <p className="text-text-muted text-lg font-medium">
                        Aperçu rapide de l'activité de l'agence.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex border-border/50 text-white hover:border-primary/50 backdrop-blur-md">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Button>
                </div>
            </motion.div>

            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Revenu Net"
                    value={kpi.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                    trend={kpi.revenueGrowth ? `${kpi.revenueGrowth}%` : undefined}
                    trendType={revenueTrendType}
                    icon={<WalletIcon size={20} />}
                    subtitle="vs mois dernier"
                    delay={0.1}
                />
                <KpiCard
                    title="MRR"
                    value={kpi.mrr.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                    trend="+0%"
                    trendType="up"
                    icon={<TrendingUp size={20} />}
                    subtitle="Revenu Récurrent"
                    delay={0.2}
                />
                <KpiCard
                    title="Projets Actifs"
                    value={kpi.activeProjects.toString()}
                    icon={<Activity size={20} />}
                    subtitle="En cours"
                    delay={0.3}
                />
                <KpiCard
                    title="Nouveaux Clients"
                    value={kpi.newClients.toString()}
                    trend={kpi.newClients > 0 ? "Actif" : "Aucun"}
                    trendType="up"
                    icon={<FolderGit2 size={20} />}
                    subtitle="Ce mois-ci"
                    delay={0.4}
                />
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Sales Overview & Customer List */}
                <div className="lg:col-span-8 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <SalesOverviewChart data={salesData} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <CustomerTable clients={topClients} />
                    </motion.div>
                </div>

                {/* Right Column: Mini charts, Premium Card & Activity Feed */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* New Customers Card (Mini) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <KpiCard
                                title="Nouveaux Clients"
                                value={kpi.newClients.toString()}
                                trend="0%"
                                trendType="down"
                                className="bg-primary/5 hover:bg-primary/10"
                                delay={0}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                            className="h-[280px]"
                        >
                            <ProfitTrendChart data={profitTrend} />
                        </motion.div>



                        {/* Activity Sidebar Integration */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                            className="bg-surface bg-opacity-40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 mt-4"
                        >
                            <ActivityFeed />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal icon component
const WalletIcon = ({ size }: { size: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
);
