-- ============================================================
-- ALTAE CRM — Patch: add missing columns to existing tables
-- Run in: Supabase Dashboard > SQL Editor
-- 100% safe to re-run — ADD COLUMN IF NOT EXISTS throughout.
-- Existing columns are silently skipped.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- FIX: ensure id columns auto-generate if they have no DEFAULT
-- (existing tables created with id TEXT and no DEFAULT will
--  throw "null value in column id" on every INSERT)
-- ════════════════════════════════════════════════════════════

ALTER TABLE opportunites ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE contacts     ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE rendez_vous  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;


-- ════════════════════════════════════════════════════════════
-- FIX: migrate contacts.type from French to English values
-- Old constraint allowed only ('personne','entreprise').
-- New app sends 'person' / 'company' → violates old check.
-- ════════════════════════════════════════════════════════════

-- 1. Drop the old check constraint (name may vary — covers both)
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_type_check;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_type_key;

-- 2. Remap existing French values to English
UPDATE contacts SET type = 'person'  WHERE type = 'personne';
UPDATE contacts SET type = 'company' WHERE type = 'entreprise';

-- 3. Re-add constraint with English values
ALTER TABLE contacts ADD CONSTRAINT contacts_type_check
  CHECK (type IN ('person', 'company'));


-- ════════════════════════════════════════════════════════════
-- FIX: old French NOT NULL columns block new inserts
-- The new app only writes to new English columns; old French
-- columns receive NULL → violates NOT NULL if no DEFAULT set.
-- Safely drop NOT NULL from every known old French column.
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE col TEXT;
BEGIN
  -- opportunites
  FOREACH col IN ARRAY ARRAY[
    'entreprise','contact','autres_contacts','type_mission',
    'montant_estime','avancement','date_cloture','statut',
    'description','commentaires'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'opportunites'
        AND column_name = col AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE opportunites ALTER COLUMN %I DROP NOT NULL', col);
    END IF;
  END LOOP;

  -- contacts
  FOREACH col IN ARRAY ARRAY[
    'nom','prenom','titre','poste','telephone','email',
    'raison_sociale','secteur','chiffre_affaires','adresse',
    'dernier_contact','commentaires','entreprise_id'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contacts'
        AND column_name = col AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE contacts ALTER COLUMN %I DROP NOT NULL', col);
    END IF;
  END LOOP;

  -- rendez_vous
  FOREACH col IN ARRAY ARRAY[
    'sujet','heure','duree','contact_id','opportunite_id','notes'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'rendez_vous'
        AND column_name = col AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE rendez_vous ALTER COLUMN %I DROP NOT NULL', col);
    END IF;
  END LOOP;
END $$;


-- ════════════════════════════════════════════════════════════
-- TABLE: opportunites
-- ════════════════════════════════════════════════════════════

-- Auto-numero: sequence + trigger (idempotent) ───────────────
CREATE SEQUENCE IF NOT EXISTS seq_opportunity_numero START 1;

CREATE OR REPLACE FUNCTION fn_set_opportunity_numero()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.numero := 'OPP-' || EXTRACT(YEAR FROM NOW())::TEXT
              || '-' || LPAD(NEXTVAL('seq_opportunity_numero')::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunity_numero ON opportunites;
CREATE TRIGGER trg_opportunity_numero
  BEFORE INSERT ON opportunites
  FOR EACH ROW EXECUTE FUNCTION fn_set_opportunity_numero();

-- Columns ────────────────────────────────────────────────────
-- Note: estimated_amount and advancement must exist BEFORE
-- weighted_amount (a GENERATED column) is added below.
ALTER TABLE opportunites
  ADD COLUMN IF NOT EXISTS numero           TEXT         UNIQUE,
  ADD COLUMN IF NOT EXISTS company          TEXT         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS main_contact     TEXT,
  ADD COLUMN IF NOT EXISTS other_contacts   TEXT,
  ADD COLUMN IF NOT EXISTS estimated_amount NUMERIC      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advancement      NUMERIC      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_date     DATE,
  ADD COLUMN IF NOT EXISTS mission_type     TEXT,
  ADD COLUMN IF NOT EXISTS status           TEXT         NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS comments         JSONB        NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by       UUID         REFERENCES auth.users(id) DEFAULT auth.uid();

-- weighted_amount is GENERATED — needs a separate statement
-- so that estimated_amount and advancement already exist.
ALTER TABLE opportunites
  ADD COLUMN IF NOT EXISTS weighted_amount  NUMERIC
    GENERATED ALWAYS AS (ROUND(estimated_amount * advancement / 100.0, 2)) STORED;

-- Contact references (added after contacts table exists)
ALTER TABLE opportunites
  ADD COLUMN IF NOT EXISTS company_id        TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS main_contact_id   TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS other_contact_ids TEXT[] NOT NULL DEFAULT '{}';


-- ════════════════════════════════════════════════════════════
-- TABLE: contacts
-- ════════════════════════════════════════════════════════════

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS type               TEXT        NOT NULL DEFAULT 'person',
  ADD COLUMN IF NOT EXISTS first_name         TEXT,
  ADD COLUMN IF NOT EXISTS last_name          TEXT,
  ADD COLUMN IF NOT EXISTS position           TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS email              TEXT,
  ADD COLUMN IF NOT EXISTS last_contact_date  DATE,
  ADD COLUMN IF NOT EXISTS parent_company_id  TEXT        REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_name       TEXT,
  ADD COLUMN IF NOT EXISTS sector             TEXT,
  ADD COLUMN IF NOT EXISTS revenue            NUMERIC,
  ADD COLUMN IF NOT EXISTS address            TEXT,
  ADD COLUMN IF NOT EXISTS comments           JSONB       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS relation_status    TEXT                 DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by         UUID        REFERENCES auth.users(id) DEFAULT auth.uid();


-- ════════════════════════════════════════════════════════════
-- TABLE: rendez_vous
-- ════════════════════════════════════════════════════════════

ALTER TABLE rendez_vous
  ADD COLUMN IF NOT EXISTS title                 TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS date                  DATE        NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS time                  TIME        NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS duration              INTEGER     NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS subject               TEXT,
  ADD COLUMN IF NOT EXISTS linked_contact_id     TEXT        REFERENCES contacts(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_opportunity_id TEXT        REFERENCES opportunites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes                 TEXT,
  ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by            UUID        REFERENCES auth.users(id) DEFAULT auth.uid();


-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

ALTER TABLE opportunites ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous  ENABLE ROW LEVEL SECURITY;

-- Drop existing policies then recreate (safe to re-run)
DO $$ DECLARE t TEXT; op TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['opportunites','contacts','rendez_vous'] LOOP
    FOREACH op IN ARRAY ARRAY['auth_select','auth_insert','auth_update','auth_delete'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', op, t);
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY auth_select ON opportunites FOR SELECT TO authenticated USING (true);
CREATE POLICY auth_insert ON opportunites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update ON opportunites FOR UPDATE TO authenticated USING (true);
CREATE POLICY auth_delete ON opportunites FOR DELETE TO authenticated USING (true);

CREATE POLICY auth_select ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY auth_insert ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update ON contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY auth_delete ON contacts FOR DELETE TO authenticated USING (true);

CREATE POLICY auth_select ON rendez_vous FOR SELECT TO authenticated USING (true);
CREATE POLICY auth_insert ON rendez_vous FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update ON rendez_vous FOR UPDATE TO authenticated USING (true);
CREATE POLICY auth_delete ON rendez_vous FOR DELETE TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════
-- REALTIME
-- Each ADD TABLE is wrapped individually so an already-added
-- table doesn't abort the whole script.
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE opportunites;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE rendez_vous;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


-- ════════════════════════════════════════════════════════════
-- VERIFY (run manually to check results)
-- ════════════════════════════════════════════════════════════
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM   information_schema.columns
-- WHERE  table_name IN ('opportunites','contacts','rendez_vous')
--   AND  table_schema = 'public'
-- ORDER  BY table_name, ordinal_position;
