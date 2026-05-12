-- ============================================================
-- ALTAE CRM — Supabase Migration Setup v2
-- Run in: Supabase Dashboard > SQL Editor
-- Safe to re-run (idempotent).
-- If you ran the previous script, the old tables (opportunites,
-- rendez_vous) are untouched — you may drop them manually after
-- a successful migration.
-- ============================================================


-- ── 0. CLEAN PREVIOUS RUN (idempotent) ───────────────────────
DROP TRIGGER  IF EXISTS trg_opportunity_numero ON opportunities;
DROP FUNCTION IF EXISTS fn_set_opportunity_numero();
DROP SEQUENCE IF EXISTS seq_opportunity_numero;


-- ── 1. SEQUENCES & AUTO-NUMERO ───────────────────────────────

CREATE SEQUENCE seq_opportunity_numero START 1;

CREATE OR REPLACE FUNCTION fn_set_opportunity_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.numero := 'OPP-' || EXTRACT(YEAR FROM NOW())::TEXT
                || '-' || LPAD(NEXTVAL('seq_opportunity_numero')::TEXT, 3, '0');
  RETURN NEW;
END;
$$;


-- ── 2. TABLES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero           TEXT UNIQUE,                          -- set by trigger
  company          TEXT NOT NULL,
  main_contact     TEXT,
  other_contacts   TEXT,
  estimated_amount NUMERIC        NOT NULL DEFAULT 0,
  advancement      NUMERIC        NOT NULL DEFAULT 0
                     CHECK (advancement IN (0,15,30,50,75,100)),
  weighted_amount  NUMERIC GENERATED ALWAYS AS
                     (ROUND(estimated_amount * advancement / 100.0, 2)) STORED,
  closing_date     DATE,
  mission_type     TEXT,
  status           TEXT           NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','won','lost')),
  description      TEXT,
  comments         JSONB          NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by       UUID           REFERENCES auth.users(id) DEFAULT auth.uid()
);

CREATE TRIGGER trg_opportunity_numero
BEFORE INSERT ON opportunities
FOR EACH ROW EXECUTE FUNCTION fn_set_opportunity_numero();


CREATE TABLE IF NOT EXISTS contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                TEXT        NOT NULL CHECK (type IN ('person','company')),
  -- Person fields
  first_name          TEXT,
  last_name           TEXT,
  position            TEXT,
  phone               TEXT,
  email               TEXT,
  last_contact_date   DATE,
  parent_company_id   UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  -- Company fields
  company_name        TEXT,
  sector              TEXT,
  revenue             NUMERIC,
  address             TEXT,
  -- Common
  comments            JSONB       NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID        REFERENCES auth.users(id) DEFAULT auth.uid()
);


CREATE TABLE IF NOT EXISTS agenda (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT        NOT NULL,
  date                  DATE        NOT NULL,
  time                  TIME        NOT NULL,
  duration              INTEGER     NOT NULL DEFAULT 60,
  subject               TEXT,
  linked_contact_id     UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  linked_opportunity_id UUID        REFERENCES opportunities(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES auth.users(id) DEFAULT auth.uid()
);


-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda        ENABLE ROW LEVEL SECURITY;

-- Drop & recreate policies (safe to re-run)
DO $$ DECLARE t TEXT; op TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['opportunities','contacts','agenda'] LOOP
    FOREACH op IN ARRAY ARRAY['auth_select','auth_insert','auth_update','auth_delete'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', op, t);
    END LOOP;
  END LOOP;
END $$;

-- opportunities
CREATE POLICY auth_select ON opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY auth_insert ON opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update ON opportunities FOR UPDATE TO authenticated USING (true);
CREATE POLICY auth_delete ON opportunities FOR DELETE TO authenticated USING (true);

-- contacts
CREATE POLICY auth_select ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY auth_insert ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update ON contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY auth_delete ON contacts FOR DELETE TO authenticated USING (true);

-- agenda
CREATE POLICY auth_select ON agenda FOR SELECT TO authenticated USING (true);
CREATE POLICY auth_insert ON agenda FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update ON agenda FOR UPDATE TO authenticated USING (true);
CREATE POLICY auth_delete ON agenda FOR DELETE TO authenticated USING (true);


-- ── 4. REALTIME ──────────────────────────────────────────────
-- Broadcasts row-level changes to connected clients.
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities, contacts, agenda;


-- ── 5. VERIFY ────────────────────────────────────────────────
-- Run as anon to confirm no data is exposed without a JWT:
-- SET ROLE anon; SELECT * FROM opportunities; -- must return 0 rows
-- RESET ROLE;
