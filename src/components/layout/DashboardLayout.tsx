import React, { type ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {

    // Automated check for overdue invoices
    useEffect(() => {
        const checkOverdueInvoices = async () => {
            try {
                // 1. Get overdue invoices
                const { data: overdueInvoices } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('status', 'overdue');

                if (overdueInvoices && overdueInvoices.length > 0) {
                    for (const invoice of overdueInvoices) {
                        const title = `Paiement en retard : ${invoice.client_name}`;

                        // 2. Check if notification already exists (to avoid spam)
                        const { data: existing } = await supabase
                            .from('notifications')
                            .select('id')
                            .eq('title', title)
                            .maybeSingle();

                        if (!existing) {
                            // 3. Create notification
                            await supabase.from('notifications').insert({
                                title: title,
                                description: `La facture ${invoice.invoice_number} de ${invoice.amount}€ est en retard (échéance : ${invoice.due_date}).`,
                                type: 'danger',
                                category: 'finance',
                                is_read: false
                            });
                            toast.error(`Alerte : Retard de paiement détecté pour ${invoice.client_name}`);
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking alerts", error);
            }
        };

        checkOverdueInvoices();
    }, []);

    return (
        <div className="flex min-h-screen bg-background text-text-main font-body">
            <Sidebar />
            <div className="ml-[280px] flex flex-1 flex-col w-[calc(100%-280px)]">
                <main className="flex-1 overflow-y-auto p-10">
                    <div className="w-full max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
