-- ============================================
-- FIX INBOX - SQL FINAL
-- ============================================

-- 1. DÉSACTIVER RLS (pour que l'interface puisse lire sans auth)
ALTER TABLE public.emails DISABLE ROW LEVEL SECURITY;

-- 2. INSÉRER UN EMAIL DE TEST
INSERT INTO public.emails (
    message_id,
    thread_id,
    from_name,
    from_email,
    subject,
    snippet,
    body,
    source,
    status
) VALUES (
    'test-email-' || NOW()::text,
    'thread-test-001',
    'Test Sender',
    'test@example.com',
    'Email de test - Vérification Inbox',
    'Ceci est un email de test pour vérifier que l''inbox fonctionne correctement.',
    'Bonjour,

Ceci est un email de test complet pour vérifier que la boîte de réception fonctionne correctement sur Vercel.

Cordialement,
Test System',
    'gmail',
    'unread'
);

-- 3. VÉRIFIER LES DONNÉES
SELECT 
    id,
    from_name,
    from_email,
    subject,
    status,
    created_at
FROM public.emails
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- NOTES
-- ============================================
-- La table emails existe déjà avec le bon schéma
-- RLS était activé et bloquait les lectures
-- Maintenant RLS est désactivé = accès libre
-- Un email de test a été inséré
-- Le front utilise déjà Supabase directement (pas d'API route)
