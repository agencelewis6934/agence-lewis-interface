# Auto-Delete Messages - Guide de Déploiement

## 📋 Vue d'ensemble

Cette Edge Function supprime automatiquement les messages de plus de 7 jours (sauf les messages étoilés).

---

## 🚀 Déploiement de la Fonction

### 1. Installer Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Vérifier l'installation
supabase --version
```

### 2. Se connecter à Supabase

```bash
# Login
supabase login

# Lier le projet
supabase link --project-ref aephlgzbojyrfkdjmcdr
```

### 3. Déployer la fonction

```bash
# Déployer la fonction delete-old-messages
supabase functions deploy delete-old-messages
```

---

## ⏰ Configuration du Cron Job

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard/project/aephlgzbojyrfkdjmcdr)
2. Naviguez vers **Database** → **Cron Jobs** (ou **Extensions** → **pg_cron**)
3. Activez l'extension `pg_cron` si ce n'est pas déjà fait
4. Créez un nouveau cron job avec cette requête SQL :

```sql
-- Activer pg_cron si nécessaire
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job (s'exécute tous les jours à 2h du matin UTC)
SELECT cron.schedule(
  'delete-old-messages-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://aephlgzbojyrfkdjmcdr.supabase.co/functions/v1/delete-old-messages',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    ) as request_id;
  $$
);
```

### Option 2 : Via SQL (Alternative)

Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Activer pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job quotidien à 2h du matin UTC
SELECT cron.schedule(
  'delete-old-messages-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://aephlgzbojyrfkdjmcdr.supabase.co/functions/v1/delete-old-messages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    );
  $$
);
```

---

## 🧪 Tester la Fonction Manuellement

### Via curl

```bash
curl -X POST \
  'https://aephlgzbojyrfkdjmcdr.supabase.co/functions/v1/delete-old-messages' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Via Supabase Dashboard

1. Allez dans **Edge Functions**
2. Sélectionnez `delete-old-messages`
3. Cliquez sur **Invoke Function**
4. Vérifiez les logs pour voir combien de messages ont été supprimés

---

## 📊 Vérifier les Logs

### Via Dashboard

1. Allez dans **Edge Functions** → **delete-old-messages**
2. Cliquez sur l'onglet **Logs**
3. Vous verrez les exécutions et le nombre de messages supprimés

### Via CLI

```bash
supabase functions logs delete-old-messages
```

---

## 🔍 Vérifier le Cron Job

```sql
-- Voir tous les cron jobs
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details 
WHERE jobname = 'delete-old-messages-daily'
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🛑 Désactiver/Supprimer le Cron Job

```sql
-- Désactiver temporairement
SELECT cron.unschedule('delete-old-messages-daily');

-- Réactiver
SELECT cron.schedule(
  'delete-old-messages-daily',
  '0 2 * * *',
  $$ ... $$
);
```

---

## ⚙️ Configuration du Cron Schedule

Le format cron est : `minute hour day month weekday`

Exemples :
- `0 2 * * *` - Tous les jours à 2h du matin
- `0 */6 * * *` - Toutes les 6 heures
- `0 0 * * 0` - Tous les dimanches à minuit
- `*/30 * * * *` - Toutes les 30 minutes

---

## 🔐 Sécurité

- La fonction utilise la `SUPABASE_SERVICE_ROLE_KEY` pour avoir les permissions admin
- Seuls les messages **non étoilés** sont supprimés
- Les messages sont **soft-deleted** (colonne `deleted_at` mise à jour)
- Les messages peuvent être récupérés si nécessaire

---

## 📝 Notes Importantes

1. **Fuseau horaire** : Les cron jobs s'exécutent en UTC
2. **Soft delete** : Les messages ne sont pas physiquement supprimés, juste marqués comme `deleted_at`
3. **Messages étoilés** : Ils ne seront JAMAIS supprimés automatiquement
4. **Période de rétention** : 7 jours (modifiable dans le code de la fonction)

---

## 🐛 Dépannage

### La fonction ne s'exécute pas

1. Vérifiez que `pg_cron` est activé :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Vérifiez que le cron job existe :
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'delete-old-messages-daily';
   ```

3. Vérifiez les logs d'exécution :
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobname = 'delete-old-messages-daily'
   ORDER BY start_time DESC;
   ```

### Erreurs dans les logs

- Vérifiez que la fonction est bien déployée
- Vérifiez que l'URL de la fonction est correcte
- Vérifiez les permissions de la service role key

---

## 🎯 Prochaines Étapes

1. ✅ Déployer la fonction Edge
2. ✅ Configurer le cron job
3. ✅ Tester manuellement
4. ✅ Vérifier les logs après 24h
5. ✅ Ajuster le schedule si nécessaire
