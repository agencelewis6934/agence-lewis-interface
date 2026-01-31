import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

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

                const { count: projectCount } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['in_progress', 'planning']);

                const { count: newClientsCount } = await supabase
                    .from('clients')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(new Date().setDate(1)).toISOString()); // This month

                // MRR could be estimated from recurring invoices or fixed for now if no subscription model
                // For now, let's treat it as 0 if no data

                setKpi({
                    revenue: totalRevenue,
                    mrr: 0, // Placeholder or calculate if applicable
                    activeProjects: projectCount || 0,
                    newClients: newClientsCount || 0,
                    revenueGrowth: 0 // Calculate vs last month if needed
                });

                // 2. Fetch Sales Overview (Projects by Tag/Category)
                const { data: projects } = await supabase
                    .from('projects')
                    .select('tags, budget');

                const categoryMap = new Map<string, number>();
                projects?.forEach(p => {
                    const tag = p.tags?.[0] || 'Other';
                    const current = categoryMap.get(tag) || 0;
                    categoryMap.set(tag, current + (p.budget || 0));
                });

                const colors = ['#E0528B', '#BB8BA6', '#F08BB0', '#333333'];
                const salesChartData = Array.from(categoryMap.entries()).map(([name, value], idx) => ({
                    name,
                    value,
                    color: colors[idx % colors.length]
                }));

                if (salesChartData.length === 0) {
                    setSalesData([{ name: 'Aucune donnée', value: 1, color: '#333' }]); // Empty state
                } else {
                    setSalesData(salesChartData);
                }

                // 3. Fetch Top Clients (using analytics_client_ltv view if available, or just clients)
                // Fallback to clients table if view doesn't exist/work
                const { data: clients } = await supabase
                    .from('clients')
                    .select('id, company_name, email, ltv')
                    .order('ltv', { ascending: false })
                    .limit(5);

                const formattedClients = clients?.map(c => ({
                    id: c.id,
                    name: c.company_name,
                    email: c.email || '',
                    deals: 0, // Need to join projects to count deals, simplifying for speed
                    value: (c.ltv || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
                    avatar: c.company_name.substring(0, 2).toUpperCase()
                })) || [];

                setTopClients(formattedClients);

                // 4. Profit Trend (Monthly revenue)
                // Simplifying to just use invoices aggregated by month for last 6 months
                setProfitTrend([]); // Leave empty or implement aggregation if time permits

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
