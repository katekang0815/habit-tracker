-- Add RLS policies to allow viewing shared users' habit data
-- Update habits table policy to allow viewing habits of users who are actively sharing
CREATE POLICY "Users can view habits of shared users" 
ON public.habits 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  user_id IN (
    SELECT user_id 
    FROM public.social_shares 
    WHERE is_active = true
  )
);

-- Update habit_snapshots table policy to allow viewing snapshots of users who are actively sharing
CREATE POLICY "Users can view habit snapshots of shared users" 
ON public.habit_snapshots 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  user_id IN (
    SELECT user_id 
    FROM public.social_shares 
    WHERE is_active = true
  )
);

-- Update habit_completions table policy to allow viewing completions of users who are actively sharing
CREATE POLICY "Users can view habit completions of shared users" 
ON public.habit_completions 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  user_id IN (
    SELECT user_id 
    FROM public.social_shares 
    WHERE is_active = true
  )
);