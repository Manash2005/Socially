-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS username text unique;

-- Optional: Add index for username if we want to search by it frequently
CREATE INDEX IF NOT EXISTS idx_dates_username ON public.profiles(username);
