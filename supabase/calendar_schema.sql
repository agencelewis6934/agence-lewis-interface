-- =====================================================
-- CALENDAR SCHEMA
-- =====================================================
-- Table pour stocker les événements du calendrier d'équipe
-- Tous les utilisateurs authentifiés ont accès complet (CRUD)

-- Table calendar_events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  video_link TEXT,
  category TEXT CHECK (category IN ('call', 'meeting', 'task', 'event')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : end_at doit être après start_at
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index sur start_at pour les requêtes de plage de dates
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at 
ON public.calendar_events(start_at);

-- Index sur end_at pour les requêtes de plage de dates
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_at 
ON public.calendar_events(end_at);

-- Index sur created_by pour filtrer par créateur
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by 
ON public.calendar_events(created_by);

-- Index sur category pour filtrer par type
CREATE INDEX IF NOT EXISTS idx_calendar_events_category 
ON public.calendar_events(category);

-- Index composite pour les requêtes de plage de dates
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range 
ON public.calendar_events(start_at, end_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER trigger_update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy SELECT : tous les utilisateurs authentifiés peuvent voir tous les événements
DROP POLICY IF EXISTS "Users can view all events" ON public.calendar_events;
CREATE POLICY "Users can view all events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (true);

-- Policy INSERT : tous les utilisateurs authentifiés peuvent créer des événements
DROP POLICY IF EXISTS "Users can create events" ON public.calendar_events;
CREATE POLICY "Users can create events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy UPDATE : tous les utilisateurs authentifiés peuvent modifier tous les événements
DROP POLICY IF EXISTS "Users can update all events" ON public.calendar_events;
CREATE POLICY "Users can update all events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy DELETE : tous les utilisateurs authentifiés peuvent supprimer tous les événements
DROP POLICY IF EXISTS "Users can delete all events" ON public.calendar_events;
CREATE POLICY "Users can delete all events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Créer quelques événements de test
INSERT INTO public.calendar_events (title, description, category, start_at, end_at, all_day, created_by)
VALUES
  (
    'Réunion d''équipe',
    'Point hebdomadaire sur les projets en cours',
    'meeting',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    false,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'Appel client - Projet X',
    'Discussion sur les spécifications du nouveau projet',
    'call',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '30 minutes',
    false,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    'Deadline - Livraison MVP',
    'Date limite pour la livraison du MVP',
    'task',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days',
    true,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VÉRIFICATIONS
-- =====================================================

-- Vérifier que la table existe
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'calendar_events';

-- Vérifier les index
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'calendar_events';

-- Vérifier les policies RLS
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'calendar_events';
