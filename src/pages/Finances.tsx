import { ArrowUpRight, ArrowDownRight, Download, FileText, CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const data = [
    { month: 'Jan', revenue: 45000, target: 40000 },
    { month: 'Fév', revenue: 52000, target: 40000 },
    { month: 'Mar', revenue: 48000, target: 45000 },
    { month: 'Avr', revenue: 61000, target: 45000 },
    { month: 'Mai', revenue: 55000, target: 50000 },
    { month: 'Juin', revenue: 67000, target: 50000 },
];

const invoices = [
    { id: 'INV-2024-001', client: 'Tech Corp', amount: '12,500 €', status: 'paid', date: '12 Jan 2024' },
    { id: 'INV-2024-002', client: 'Science Lab', amount: '5,000 €', status: 'pending', date: '15 Jan 2024' },
    { id: 'INV-2024-003', client: 'Power Systems', amount: '25,000 €', status: 'overdue', date: '01 Jan 2024' },
    { id: 'INV-2024-004', client: 'Navy Tech', amount: '3,200 €', status: 'paid', date: '20 Jan 2024' },
];

const kpis = [
    { title: 'CA Mensuel', value: '67,000', suffix: '€', trend: '+15.2%', up: true, color: 'from-emerald-500 to-teal-600' },
    { title: 'Factures en attente', value: '32,450', suffix: '€', trend: '+5.4%', up: false, color: 'from-amber-500 to-orange-600' },
    { title: 'Prévisions Trésorerie', value: '145,000', suffix: '€', trend: 'Stable', up: true, color: 'from-violet-500 to-purple-600' },
];

export function Finances() {
    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-5xl font-bold tracking-tight mb-2">
                        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                            Finances
                        </span>
                    </h2>
                    <p className="text-text-muted text-lg">
                        Suivez la santé financière et les prévisions de l'agence
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="text-white border-border hover:border-primary/50" onClick={() => toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), { loading: 'Génération du rapport...', success: 'Rapport téléchargé !', error: 'Erreur' })}>
                        <Download className="mr-2 h-4 w-4" /> Télécharger Rapport
                    </Button>
                    <Button variant="primary" onClick={() => toast.success("Nouvelle facture créée (simulation)")}>
                        <DollarSign className="mr-2 h-4 w-4" /> Nouvelle Facture
                    </Button>
                </div>
            </motion.div>

            {/* KPIs */}
            <div className="grid gap-6 md:grid-cols-3">
                {kpis.map((kpi, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                    >
                        <Card hoverable className="group relative overflow-hidden bg-opacity-40 backdrop-blur-md">
                            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-semibold text-text-muted uppercase tracking-widest">{kpi.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-white font-display mb-2">
                                    {kpi.value}<span className="text-xl text-text-muted ml-1">{kpi.suffix}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {kpi.up ? (
                                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-danger" />
                                    )}
                                    <span className={`text-sm font-bold ${kpi.up ? 'text-emerald-500' : 'text-danger'}`}>
                                        {kpi.trend}
                                    </span>
                                    {i !== 2 && <span className="text-xs text-text-subtle">vs mois dernier</span>}
                                    {i === 2 && <span className="text-xs text-text-subtle">pour T1 2024</span>}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Chart & Invoices */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Performance Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="lg:col-span-4 bg-opacity-60 backdrop-blur-md border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-white">Performance Mensuelle</CardTitle>
                            <CardDescription className="text-text-muted mt-1">
                                Comparaison du CA réalisé vs objectifs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[320px] -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#E0528B" stopOpacity={1} />
                                            <stop offset="95%" stopColor="#B03E6A" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `${value / 1000}k€`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1C1C1F',
                                            border: '1px solid #27272A',
                                            borderRadius: '16px',
                                            padding: '12px 16px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                        }}
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    />
                                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={40}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.revenue >= entry.target ? 'url(#barGradient)' : '#6B7280'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Invoices */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card hoverable className="lg:col-span-3 overflow-hidden bg-opacity-60 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle">
                            <CardTitle className="text-white text-lg">Dernières Factures</CardTitle>
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 -mr-2" onClick={() => toast.info("Historique complet bientôt disponible")}>
                                Tout voir
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border-subtle">
                                {invoices.map((inv, idx) => (
                                    <motion.div
                                        key={inv.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + idx * 0.05 }}
                                        className="group flex items-center justify-between p-5 hover:bg-surface-elevated/30 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-surface-hover flex items-center justify-center text-text-subtle group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{inv.client}</p>
                                                <p className="text-xs text-text-subtle">{inv.id} • {inv.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-white mb-1">{inv.amount}</p>
                                            {inv.status === 'paid' ? (
                                                <Badge variant="success" className="text-[10px]">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Payé
                                                </Badge>
                                            ) : inv.status === 'pending' ? (
                                                <Badge variant="warning" className="text-[10px]">
                                                    <Clock className="h-3 w-3 mr-1" /> En attente
                                                </Badge>
                                            ) : (
                                                <Badge variant="error" className="text-[10px]">
                                                    <AlertCircle className="h-3 w-3 mr-1" /> Impayé
                                                </Badge>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
