-- First, drop the existing overly permissive policies for the profiles table
DROP POLICY IF EXISTS "Users can view own profile and shared profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a more secure policy that only allows authenticated users to view their own profiles
-- and profiles of users who have explicitly enabled social sharing
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create a separate policy for viewing shared profiles (only for authenticated users)
CREATE POLICY "Users can view shared profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  user_id IN (
    SELECT user_id 
    FROM public.social_shares 
    WHERE is_active = true
  )
);

-- Ensure anonymous users cannot access the profiles table at all
-- This is implicit with the above policies since they're TO authenticated only,
-- but let's be explicit by ensuring no public access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;