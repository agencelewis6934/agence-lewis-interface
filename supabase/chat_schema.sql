-- ============================================
-- CHAT FEATURE - DATABASE SCHEMA
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CHAT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('dm', 'channel')),
    name TEXT,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CHAT CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.chat_conversation_members (
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- 4. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. CHAT ATTACHMENTS TABLE (Optional)
CREATE TABLE IF NOT EXISTS public.chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON public.chat_conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON public.chat_conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_conversation_id ON public.chat_conversation_members(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON public.chat_attachments(message_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- CHAT CONVERSATIONS POLICIES
-- Admins can do everything
CREATE POLICY "Admins can manage conversations"
ON public.chat_conversations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Members can read their conversations
CREATE POLICY "Members can read their conversations"
ON public.chat_conversations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_conversation_members
        WHERE conversation_id = id AND user_id = auth.uid()
    )
);

-- CHAT CONVERSATION MEMBERS POLICIES
-- Admins can manage members
CREATE POLICY "Admins can manage members"
ON public.chat_conversation_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Users can read members of their conversations
CREATE POLICY "Users can read conversation members"
ON public.chat_conversation_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_conversation_members cm
        WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    )
);

-- CHAT MESSAGES POLICIES
-- Admins can manage all messages
CREATE POLICY "Admins can manage messages"
ON public.chat_messages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Members can read messages in their conversations
CREATE POLICY "Members can read messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_conversation_members
        WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()
    )
);

-- Members can insert messages in their conversations
CREATE POLICY "Members can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.chat_conversation_members
        WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()
    )
);

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- CHAT ATTACHMENTS POLICIES
-- Admins can manage attachments
CREATE POLICY "Admins can manage attachments"
ON public.chat_attachments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Members can read attachments in their conversations
CREATE POLICY "Members can read attachments"
ON public.chat_attachments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_messages cm
        JOIN public.chat_conversation_members ccm ON ccm.conversation_id = cm.conversation_id
        WHERE cm.id = chat_attachments.message_id AND ccm.user_id = auth.uid()
    )
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================
-- Enable realtime on chat_messages and chat_conversation_members
-- This must be done in Supabase Dashboard → Database → Replication
-- Or via SQL:

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- Create a general channel for all admins
INSERT INTO public.chat_conversations (type, name, description, created_by)
SELECT 
    'channel',
    'Général',
    'Canal général pour tous les administrateurs',
    id
FROM public.profiles
WHERE role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.profiles IS 'User profiles with role and online status';
COMMENT ON TABLE public.chat_conversations IS 'Chat conversations (DM or channels)';
COMMENT ON TABLE public.chat_conversation_members IS 'Members of each conversation';
COMMENT ON TABLE public.chat_messages IS 'Messages in conversations';
COMMENT ON TABLE public.chat_attachments IS 'File attachments for messages';
