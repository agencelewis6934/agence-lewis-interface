-- Create emails table for Gmail inbox
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    thread_id TEXT,
    from_name TEXT,
    from_email TEXT,
    subject TEXT,
    snippet TEXT,
    body TEXT,
    source TEXT DEFAULT 'gmail',
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on message_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON public.emails(message_id);

-- Create index on thread_id for thread grouping
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON public.emails(thread_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON public.emails(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_emails_status ON public.emails(status);

-- Enable Row Level Security
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON public.emails
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow insert for anon users (for API endpoint)
CREATE POLICY "Allow insert for anon users"
ON public.emails
FOR INSERT
TO anon
WITH CHECK (true);

-- Create policy to allow read for anon users (for API endpoint)
CREATE POLICY "Allow read for anon users"
ON public.emails
FOR SELECT
TO anon
USING (true);

-- Add comment to table
COMMENT ON TABLE public.emails IS 'Stores emails received from Gmail via n8n webhook';
