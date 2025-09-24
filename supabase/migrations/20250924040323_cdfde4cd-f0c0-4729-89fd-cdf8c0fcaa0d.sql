-- Add foreign key constraint between social_shares and profiles
ALTER TABLE public.social_shares 
ADD CONSTRAINT fk_social_shares_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;