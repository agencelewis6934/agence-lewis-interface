import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

export default async function handler(req: any, res: any) {
    // Helper to get env vars
    const getEnv = (key: string) => process.env[key] || process.env[`VITE_${key}`];
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        return res.status(500).json({
            error: 'Server Configuration Error: Missing Supabase Environment Variables',
            debug: {
                urlPresent: !!supabaseUrl,
                keyPresent: !!supabaseAnonKey
            }
        });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: req.headers.authorization,
            },
        },
        auth: { persistSession: false, autoRefreshToken: false }
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { csvContent, userId } = req.body;

        if (!csvContent) {
            return res.status(400).json({ error: 'Contenu CSV manquant' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'UserId manquant' });
        }

        // Parse CSV
        const parseResult = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            delimiter: "", // Auto-detect
        });

        const rows = parseResult.data as any[];

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

            // Helper for initials
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
                contact_name: contact_name || company_name,
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
                return res.status(500).json({ error: 'Erreur lors de l’insertion en base', details: insertError });
            }
            insertedCount = processed.toInsert.length;
        }

        return res.status(200).json({
            ok: true,
            insertedCount,
            duplicateCount: processed.duplicateCount,
            invalidCount: processed.invalidCount,
            totalCount: processed.totalCount
        });

    } catch (error: any) {
        console.error('Error processing CSV import:', error);
        return res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
    }
}
