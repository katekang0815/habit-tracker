-- Fix security vulnerability: Restrict profile access to only shared profiles and own profile
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive policy that allows:
-- 1. Users to view their own profile
-- 2. Users to view profiles of users who have actively shared them
CREATE POLICY "Users can view own profile and shared profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR user_id IN (
    SELECT user_id 
    FROM public.social_shares 
    WHERE is_active = true
  )
);