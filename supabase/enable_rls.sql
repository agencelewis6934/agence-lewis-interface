-- Migration: Re-enable RLS on calendar_events
-- This migration re-enables Row Level Security on the calendar_events table

-- Re-enable RLS on calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Verify that the policies exist (they should already be there from calendar_schema.sql)
-- If not, create them:

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete all calendar events" ON calendar_events;

-- Create policies for full team access
CREATE POLICY "Users can view all calendar events"
    ON calendar_events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create calendar events"
    ON calendar_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update all calendar events"
    ON calendar_events FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete all calendar events"
    ON calendar_events FOR DELETE
    TO authenticated
    USING (true);
