import { supabase } from '../src/lib/supabase';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const emailData = req.body;

        // Validate required fields
        if (!emailData.messageId) {
            return res.status(400).json({ error: 'messageId is required' });
        }

        // Insert email into Supabase
        const { data, error } = await supabase
            .from('emails')
            .insert({
                message_id: emailData.messageId,
                thread_id: emailData.threadId || null,
                from_name: emailData.fromName || null,
                from_email: emailData.fromEmail || null,
                subject: emailData.subject || '(No Subject)',
                snippet: emailData.snippet || null,
                body: emailData.body || null,
                source: emailData.source || 'gmail',
                status: emailData.status || 'unread',
            })
            .select()
            .single();

        if (error) {
            // If it's a duplicate messageId, return success (idempotent)
            if (error.code === '23505') {
                return res.status(200).json({ ok: true, message: 'Email already exists' });
            }

            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ ok: true, data });
    } catch (error: any) {
        console.error('Error processing email:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
