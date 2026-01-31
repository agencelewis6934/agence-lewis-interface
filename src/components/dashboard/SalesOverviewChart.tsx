import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';

interface SalesOverviewChartProps {
    data: { name: string; value: number; color: string }[];
}

export const SalesOverviewChart: React.FC<SalesOverviewChartProps> = ({ data }) => {

    const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);
    const formattedTotal = totalValue >= 1000 ? `${(totalValue / 1000).toFixed(1)}k` : totalValue.toString();

    return (
        <Card className="bg-surface bg-opacity-40 backdrop-blur-xl border-border/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold text-white">Aperçu des Ventes</CardTitle>
                <Button variant="ghost" size="icon" className="text-text-muted">
                    <MoreHorizontal size={20} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    <div className="relative w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-bold text-white tracking-tight">{formattedTotal}</span>
                            <span className="text-xs text-text-muted mt-1 uppercase tracking-wider">Budget Total</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full mt-6">
                        {data.map((item, index) => (
                            <div key={index} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-text-muted">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-white ml-4">
                                    {item.value.toLocaleString('fr-FR')} €
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
