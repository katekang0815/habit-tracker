-- Fix the RLS policies for habit_completions to allow proper upsert operations

-- Drop and recreate the UPDATE policy without date restriction
DROP POLICY IF EXISTS "Users can update their own completions" ON public.habit_completions;

CREATE POLICY "Users can update their own completions" 
ON public.habit_completions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Also ensure the INSERT policy is clear
DROP POLICY IF EXISTS "Users can create their own completions" ON public.habit_completions;

CREATE POLICY "Users can create their own completions" 
ON public.habit_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);