-- Rename bio column to target_role in profiles table
ALTER TABLE public.profiles 
RENAME COLUMN bio TO target_role;