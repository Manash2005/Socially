-- Migration: Change visibility to JSONB and migrate existing data
-- This script converts strings 'public' and 'campus' to the new object format.

-- 1. Alter the column type to JSONB
-- Note: In Supabase/PostgreSQL, we use JSONB for efficient JSON operations.
-- If the column already contains data, we need to specify how to convert it.

ALTER TABLE public.posts 
ALTER COLUMN visibility SET DEFAULT '{"batches": [], "campuses": [], "branches": []}'::jsonb;

UPDATE public.posts
SET visibility = CASE 
    WHEN visibility::text = 'public' THEN '{"batches": [], "campuses": [], "branches": []}'::jsonb
    WHEN visibility::text = 'campus' THEN '{"batches": [], "campuses": [], "branches": []}'::jsonb -- Assuming 'campus' meant restricted but defaults to empty for now
    ELSE '{"batches": [], "campuses": [], "branches": []}'::jsonb -- Default for any other values
END
WHERE visibility IS NOT NULL AND (visibility::text = 'public' OR visibility::text = 'campus');

-- Ensure the type is changed (if it wasn't already or to ensure compatibility)
ALTER TABLE public.posts 
ALTER COLUMN visibility TYPE jsonb USING visibility::jsonb;
