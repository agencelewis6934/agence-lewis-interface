import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

const customers = [
    { name: 'Danny Liu', email: 'danny@gmail.com', deals: 1023, value: '37,431 €', avatar: 'DL' },
    { name: 'Bella Deviant', email: 'bella@gmail.com', deals: 963, value: '30,423 €', avatar: 'BD' },
    { name: 'Darrell Steward', email: 'darrell@gmail.com', deals: 843, value: '28,549 €', avatar: 'DS' },
    { name: 'Guy Hawkins', email: 'guy@gmail.com', deals: 712, value: '25,102 €', avatar: 'GH' },
];

export const CustomerTable: React.FC = () => {
    return (
        <Card className="bg-surface bg-opacity-40 backdrop-blur-xl border-border/50 h-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">Liste des Clients</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-text-muted">
                        <MoreHorizontal size={20} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-border/30 text-text-muted text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Nom</th>
                                <th className="px-6 py-4">Deals</th>
                                <th className="px-6 py-4">Valeur Totale</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {customers.map((customer, idx) => (
                                <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-primary to-secondary text-white font-bold" fallback={customer.avatar} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-white">{customer.name}</span>
                                                <span className="text-xs text-text-muted">{customer.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-white">{customer.deals.toLocaleString('fr-FR')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-white tracking-tight">{customer.value}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowUpRight size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-border/30">
                    <Button variant="ghost" className="w-full text-text-muted hover:text-white text-sm">
                        Voir tous les clients
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
