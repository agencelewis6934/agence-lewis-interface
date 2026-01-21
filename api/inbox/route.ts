import { supabase } from '../../../src/lib/supabase';

export async function POST(req: Request) {
    try {
        const emailData = await req.json();

        // Validate required fields
        if (!emailData.messageId) {
            return new Response(
                JSON.stringify({ error: 'messageId is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
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
                console.log('Duplicate email ignored:', emailData.messageId);
                return new Response(
                    JSON.stringify({ ok: true, message: 'Email already exists' }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }

            console.error('Supabase error:', error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log('Email saved:', data);

        return new Response(
            JSON.stringify({ ok: true, data }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error processing email:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
