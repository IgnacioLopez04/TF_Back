-- Migration: add versioning columns to hc_fisiatrica for historial (append-only versions)
-- Run once. PostgreSQL 9.5+ (ADD COLUMN IF NOT EXISTS).

-- 1. Add versioning columns
ALTER TABLE hc_fisiatrica
  ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Backfill: assign version_number per id_historia_clinica (oldest = 1, newest = max)
UPDATE hc_fisiatrica h
SET version_number = sub.rn
FROM (
  SELECT id_hc_fisiatrica,
    ROW_NUMBER() OVER (
      PARTITION BY id_historia_clinica
      ORDER BY COALESCE(fecha_creacion, '1970-01-01'::timestamp), id_hc_fisiatrica
    ) AS rn
  FROM hc_fisiatrica
) sub
WHERE h.id_hc_fisiatrica = sub.id_hc_fisiatrica;

-- 3. Set effective_from from fecha_creacion where available (optional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_fisiatrica' AND column_name = 'fecha_creacion'
  ) THEN
    UPDATE hc_fisiatrica SET effective_from = fecha_creacion WHERE fecha_creacion IS NOT NULL;
  END IF;
END $$;

-- 4. Mark only the latest version per history as current; others get is_current = FALSE
UPDATE hc_fisiatrica h
SET is_current = (h.version_number = (
  SELECT MAX(h2.version_number) FROM hc_fisiatrica h2 WHERE h2.id_historia_clinica = h.id_historia_clinica
));

-- 5. Set effective_to for non-current rows to the effective_from of the next version
UPDATE hc_fisiatrica h
SET effective_to = (
  SELECT h3.effective_from
  FROM hc_fisiatrica h3
  WHERE h3.id_historia_clinica = h.id_historia_clinica AND h3.version_number = h.version_number + 1
)
WHERE h.is_current = FALSE;

-- 6. Unique constraint: one version number per history
ALTER TABLE hc_fisiatrica
  DROP CONSTRAINT IF EXISTS uq_hc_fisiatrica_version,
  ADD CONSTRAINT uq_hc_fisiatrica_version UNIQUE (id_historia_clinica, version_number);

-- 7. Partial unique index: only one current version per history
DROP INDEX IF EXISTS idx_hc_fisiatrica_current;
CREATE UNIQUE INDEX idx_hc_fisiatrica_current
  ON hc_fisiatrica (id_historia_clinica) WHERE (is_current = TRUE);
