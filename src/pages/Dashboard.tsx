import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Users, FolderGit2, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar } from 'lucide-react';

// Recent activity will be loaded from database
const recentActivity: any[] = [];


export const Dashboard: React.FC = () => {
    return (
        <div className="space-y-8 pb-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Tableau de bord</h1>
                    <p className="text-text-muted">Aperçu rapide de l'activité de l'agence.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="hidden sm:flex" onClick={() => console.log('Date filter')}>
                        <Calendar className="mr-2 h-4 w-4" /> Jan 2026
                    </Button>
                    <Button variant="primary" onClick={() => console.log('Download report')}>
                        Télécharger Rapport
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Revenu Total", value: "€0.00", trend: "Aucune donnée", trending: "up", icon: <TrendingUp className="h-4 w-4" /> },
                    { title: "Nouveaux Clients", value: "0", trend: "Aucun client", trending: "up", icon: <Users className="h-4 w-4" /> },
                    { title: "Projets Actifs", value: "0", trend: "Aucun projet", trending: "down", icon: <FolderGit2 className="h-4 w-4" /> },
                    { title: "Taux d'Engagement", value: "0%", trend: "Aucune donnée", trending: "up", icon: <Activity className="h-4 w-4" /> }
                ].map((stat, i) => (
                    <div key={i}>
                        <StatCard
                            title={stat.title}
                            value={stat.value}
                            trend={stat.trend}
                            trending={stat.trending as any}
                            icon={stat.icon}
                        />
                    </div>
                ))}
            </div>

            {/* Detailed Project Table */}
            <div>
                <Card className="bg-opacity-50 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Projets en Cours</CardTitle>
                            <CardDescription>Liste détaillée des projets actifs et leur statut.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-text-subtle">Tout voir <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                    <div className="p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-text-subtle uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Nom du Projet</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4">Revenu</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {recentActivity.map((project) => (
                                    <tr key={project.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{project.project}</td>
                                        <td className="px-6 py-4 text-text-muted">{project.client}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'Pending' ? 'warning' : 'info'}>
                                                {project.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{project.amount}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    trend: string;
    trending: 'up' | 'down';
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trending, icon }) => (
    <Card className="bg-opacity-50 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-text-muted">{title}</CardTitle>
            <div className="h-4 w-4 text-text-muted">{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-white">{value}</div>
            <p className="text-xs text-text-muted flex items-center pt-1">
                {trending === 'up' ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={trending === 'up' ? "text-emerald-500" : "text-red-500"}>
                    {trend}
                </span>
            </p>
        </CardContent>
    </Card>
);
