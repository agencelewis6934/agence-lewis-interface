import { supabase } from '../../../src/lib/supabase';
import Papa from 'papaparse';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { csvContent, userId } = body;

        if (!csvContent) {
            return new Response(
                JSON.stringify({ error: 'Contenu CSV manquant' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'UserId manquant' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parse CSV
        const parseResult = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            delimiter: "", // Auto-detect
        });

        const rows = parseResult.data as any[];
        const headers = parseResult.meta.fields || [];

        // Mapping rules
        const mapping = {
            company_name: ['company', 'entreprise', 'company_name', 'societe'],
            email: ['email', 'mail'],
            contact_name: ['contact_name', 'nom', 'fullname', 'contact'],
            phone: ['phone', 'tel', 'telephone', 'mobile'],
            notes: ['notes', 'commentaire', 'description']
        };

        const getMappedValue = (row: any, targetField: keyof typeof mapping) => {
            const possibleNames = mapping[targetField];
            const foundKey = Object.keys(row).find(key =>
                possibleNames.includes(key.toLowerCase().trim())
            );
            return foundKey ? row[foundKey] : null;
        };

        // Fetch existing clients for deduplication
        const { data: existingClients } = await supabase
            .from('clients')
            .select('email, company_name')
            .eq('user_id', userId);

        const existingEmails = new Set(existingClients?.map(c => c.email?.toLowerCase()).filter(Boolean));
        const existingCompanies = new Set(existingClients?.map(c => c.company_name?.toLowerCase()).filter(Boolean));

        const processed = {
            toInsert: [] as any[],
            invalidCount: 0,
            duplicateCount: 0,
            totalCount: rows.length
        };

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        rows.forEach(row => {
            const company_name = getMappedValue(row, 'company_name');
            const email = getMappedValue(row, 'email');
            const contact_name = getMappedValue(row, 'contact_name');
            const phone = getMappedValue(row, 'phone');
            const notes = getMappedValue(row, 'notes');

            // 1. Validation: company_name required
            if (!company_name) {
                processed.invalidCount++;
                return;
            }

            // 2. Validation: email format if present
            if (email && !emailRegex.test(email)) {
                processed.invalidCount++;
                return;
            }

            // 3. Deduplication
            const normalizedEmail = email?.toLowerCase().trim();
            const normalizedCompany = company_name?.toLowerCase().trim();

            if (normalizedEmail && existingEmails.has(normalizedEmail)) {
                processed.duplicateCount++;
                return;
            }

            if (!normalizedEmail && normalizedCompany && existingCompanies.has(normalizedCompany)) {
                processed.duplicateCount++;
                return;
            }

            // Check within current batch too
            if (processed.toInsert.some(c =>
                (normalizedEmail && c.email?.toLowerCase() === normalizedEmail) ||
                (!normalizedEmail && c.company_name?.toLowerCase() === normalizedCompany)
            )) {
                processed.duplicateCount++;
                return;
            }

            // Helper for initials (since it's computed in the frontend/base, we should ideally do it here too)
            const getInitials = (name: string) => {
                if (!name) return 'C';
                return name
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
            };

            processed.toInsert.push({
                company_name,
                contact_name: contact_name || company_name, // Default contact to company name if missing
                email: email || null,
                phone: phone || null,
                notes: notes || null,
                status: 'prospect',
                user_id: userId,
                avatar: getInitials(contact_name || company_name),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        });

        // Bulk insert
        let insertedCount = 0;
        if (processed.toInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('clients')
                .insert(processed.toInsert);

            if (insertError) {
                console.error('Bulk insert error:', insertError);
                return new Response(
                    JSON.stringify({ error: 'Erreur lors de l’insertion en base', details: insertError }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
            insertedCount = processed.toInsert.length;
        }

        return new Response(
            JSON.stringify({
                ok: true,
                insertedCount,
                duplicateCount: processed.duplicateCount,
                invalidCount: processed.invalidCount,
                totalCount: processed.totalCount
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error processing CSV import:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Erreur interne du serveur' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
