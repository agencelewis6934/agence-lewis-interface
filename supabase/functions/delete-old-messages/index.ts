import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client with service role key for admin access
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString();

        console.log(`[Auto-Delete] Deleting messages older than: ${cutoffDate}`);

        // Soft delete messages older than 7 days that are NOT starred
        const { data, error } = await supabase
            .from('chat_messages')
            .update({ deleted_at: new Date().toISOString() })
            .lt('created_at', cutoffDate)
            .eq('is_starred', false)
            .is('deleted_at', null)
            .select('id');

        if (error) {
            console.error('[Auto-Delete] Error:', error);
            throw error;
        }

        const deletedCount = data?.length || 0;
        console.log(`[Auto-Delete] Successfully deleted ${deletedCount} messages`);

        return new Response(
            JSON.stringify({
                success: true,
                deleted_count: deletedCount,
                cutoff_date: cutoffDate,
                message: `Deleted ${deletedCount} messages older than 7 days`,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('[Auto-Delete] Fatal error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
