import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type KpiData = {
    revenue: number;
    mrr: number;
    activeProjects: number;
    newClients: number;
    revenueGrowth: number;
};

type SalesCategory = {
    name: string;
    value: number;
    color: string;
};

type TrendData = {
    name: string;
    profit: number;
};

type TopClient = {
    id: string;
    name: string;
    email: string;
    deals: number;
    value: string;
    avatar: string;
};

export function useDashboardMetrics() {
    const [kpi, setKpi] = useState<KpiData>({
        revenue: 0,
        mrr: 0,
        activeProjects: 0,
        newClients: 0,
        revenueGrowth: 0
    });
    const [salesData, setSalesData] = useState<SalesCategory[]>([]);
    const [profitTrend, setProfitTrend] = useState<TrendData[]>([]);
    const [topClients, setTopClients] = useState<TopClient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                // 1. Fetch KPI Data
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('amount, created_at')
                    .eq('status', 'paid');

                const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

                // 2. Fetch Sales Overview (Projects by Payment Status)
                const { data: projects } = await supabase
                    .from('projects')
                    .select('status, price, created_at, is_paid');

                // Update Active Projects KPI
                const activeCount = projects?.filter(p => ['in-progress', 'review'].includes(p.status)).length || 0;

                // Calculate Revenue Growth (Placeholder or actual logic if needed)

                const { count: newClientsCount } = await supabase
                    .from('clients')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(new Date().setDate(1)).toISOString()); // This month

                setKpi(prev => ({
                    ...prev,
                    revenue: totalRevenue,
                    activeProjects: activeCount,
                    newClients: newClientsCount || 0
                }));

                // Calculate Sales Data based on PAID projects
                const statusMap = new Map<string, number>();
                projects?.filter(p => p.is_paid).forEach(p => {
                    const status = p.status === 'in-progress' ? 'En Cours' :
                        p.status === 'review' ? 'En Révision' :
                            p.status === 'done' ? 'Terminé' : 'À Faire';
                    const current = statusMap.get(status) || 0;
                    statusMap.set(status, current + (Number(p.price) || 0));
                });

                const colors = ['#E0528B', '#BB8BA6', '#F08BB0', '#333333'];
                const salesChartData = Array.from(statusMap.entries()).map(([name, value], idx) => ({
                    name,
                    value,
                    color: colors[idx % colors.length]
                }));

                setSalesData(salesChartData);

                // 3. Calculate Profit Trend and Total Profit
                // Filter projects that ARE marked as PAID
                const paidProjects = projects?.filter(p => p.is_paid) || [];

                // Group by month for the trend chart
                const monthlyData = new Map<string, number>();
                const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

                paidProjects.forEach(p => {
                    const date = new Date(p.created_at);
                    const monthKey = months[date.getMonth()];
                    const current = monthlyData.get(monthKey) || 0;
                    monthlyData.set(monthKey, current + (Number(p.price) || 0));
                });

                // Get last 6 months for trend
                const last6Months = [];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const monthName = months[d.getMonth()];
                    last6Months.push({
                        name: monthName,
                        profit: monthlyData.get(monthName) || 0
                    });
                }
                setProfitTrend(last6Months);

                // 3. Fetch Top Clients (using analytics_client_ltv view if available, or just clients)
                // Fallback to clients table if view doesn't exist/work
                const { data: clients } = await supabase
                    .from('clients')
                    .select('id, contact_name, company_name, email')
                    .limit(5);

                const formattedClients = clients?.map(c => ({
                    id: c.id,
                    name: c.company_name || c.contact_name,
                    email: c.email || '',
                    deals: 0,
                    value: '0,00 €',
                    avatar: (c.company_name || c.contact_name || 'C').substring(0, 2).toUpperCase()
                })) || [];

                setTopClients(formattedClients);

                // 4. Already handled above with startedProjects

            } catch (error) {
                console.error('Error fetching dashboard metrics:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();
    }, []);

    return { kpi, salesData, profitTrend, topClients, loading };
}
