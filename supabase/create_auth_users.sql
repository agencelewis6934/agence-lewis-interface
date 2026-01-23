-- Migration: Create Supabase Auth Users
-- This migration creates the two users in auth.users table

-- Create Angel's account
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'a.payet@agence-lewis.fr',
    crypt('Admin123@!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Angel"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- Create Antoine's account
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'a.pivetti@agence-lewis.fr',
    crypt('Admin123@!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Antoine"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- Ensure the profiles exist and are linked
INSERT INTO public.profiles (id, display_name, email, role)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Angel', 'a.payet@agence-lewis.fr', 'admin'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Antoine', 'a.pivetti@agence-lewis.fr', 'admin')
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Create identities for email authentication
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    jsonb_build_object(
        'sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'email', 'a.payet@agence-lewis.fr'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
), (
    gen_random_uuid(),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    jsonb_build_object(
        'sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'email', 'a.pivetti@agence-lewis.fr'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, user_id) DO NOTHING;
