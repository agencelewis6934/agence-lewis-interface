-- Migration: Create Angel and Antoine user profiles
-- Description: Sets up two admin users for the chat system
-- Date: 2026-01-21

-- Delete old admin profile if exists
DELETE FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';

-- Delete old chat_conversation_members for old admin
DELETE FROM public.chat_conversation_members WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Insert Angel's profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a.payet@agence-lewis.fr',
    'Angel',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Insert Antoine's profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'a.pivetti@agence-lewis.fr',
    'Antoine',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Get conversation IDs for "Général" and "Développement"
DO $$
DECLARE
    general_conv_id UUID;
    dev_conv_id UUID;
BEGIN
    -- Find conversation IDs
    SELECT id INTO general_conv_id FROM public.chat_conversations WHERE name = 'Général' LIMIT 1;
    SELECT id INTO dev_conv_id FROM public.chat_conversations WHERE name = 'Développement' LIMIT 1;

    -- Add Angel to both channels
    IF general_conv_id IS NOT NULL THEN
        INSERT INTO public.chat_conversation_members (conversation_id, user_id, joined_at)
        VALUES (general_conv_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW())
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    IF dev_conv_id IS NOT NULL THEN
        INSERT INTO public.chat_conversation_members (conversation_id, user_id, joined_at)
        VALUES (dev_conv_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW())
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    -- Add Antoine to both channels
    IF general_conv_id IS NOT NULL THEN
        INSERT INTO public.chat_conversation_members (conversation_id, user_id, joined_at)
        VALUES (general_conv_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW())
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    IF dev_conv_id IS NOT NULL THEN
        INSERT INTO public.chat_conversation_members (conversation_id, user_id, joined_at)
        VALUES (dev_conv_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW())
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
END $$;

-- Verify profiles were created
SELECT id, email, full_name, role FROM public.profiles 
WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Verify channel memberships
SELECT 
    cm.user_id,
    p.full_name,
    c.name as channel_name
FROM public.chat_conversation_members cm
JOIN public.profiles p ON p.id = cm.user_id
JOIN public.chat_conversations c ON c.id = cm.conversation_id
WHERE cm.user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ORDER BY p.full_name, c.name;
