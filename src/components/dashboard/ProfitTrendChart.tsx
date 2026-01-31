import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp } from 'lucide-react';

interface ProfitTrendChartProps {
    data: { name: string; profit: number }[];
}

export const ProfitTrendChart: React.FC<ProfitTrendChartProps> = ({ data }) => {
    const totalProfit = data.reduce((acc, curr) => acc + curr.profit, 0);
    const formattedProfit = totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'EUR' });

    return (
        <Card className="bg-surface bg-opacity-40 backdrop-blur-xl border-border/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-text-muted">Total Profit</CardTitle>
                    <div className="text-2xl font-bold text-white">{formattedProfit}</div>
                </div>
                <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold bg-emerald-500/10 px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    +42%
                </div>
            </CardHeader>
            <CardContent className="h-[180px] mt-4 p-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E0528B" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#E0528B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#E0528B"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
