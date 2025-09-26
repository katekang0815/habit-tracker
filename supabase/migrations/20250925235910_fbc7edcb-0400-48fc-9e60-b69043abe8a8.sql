-- Rename the existing linkedin column to notion_url to match its current usage
ALTER TABLE public.profiles RENAME COLUMN linkedin TO notion_url;

-- Add a new linkedin column for LinkedIn URLs
ALTER TABLE public.profiles ADD COLUMN linkedin TEXT;