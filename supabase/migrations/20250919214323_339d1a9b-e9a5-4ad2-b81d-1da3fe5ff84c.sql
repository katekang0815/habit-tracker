-- Add bio and linkedin columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT,
ADD COLUMN linkedin TEXT;