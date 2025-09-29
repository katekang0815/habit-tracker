-- Fix security warnings by updating functions with proper search_path

-- Update function to validate social share LinkedIn with search_path
CREATE OR REPLACE FUNCTION public.validate_social_share_linkedin()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If trying to set is_active to true, check if user has LinkedIn
  IF NEW.is_active = true THEN
    -- Check if user has a LinkedIn URL
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = NEW.user_id 
      AND linkedin IS NOT NULL 
      AND linkedin != ''
    ) THEN
      RAISE EXCEPTION 'Cannot activate social sharing without a LinkedIn URL in profile';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update function to deactivate share on LinkedIn removal with search_path
CREATE OR REPLACE FUNCTION public.deactivate_share_on_linkedin_removal()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If LinkedIn URL is being removed or set to empty
  IF (OLD.linkedin IS NOT NULL AND OLD.linkedin != '') 
     AND (NEW.linkedin IS NULL OR NEW.linkedin = '') THEN
    -- Deactivate social sharing
    UPDATE public.social_shares 
    SET is_active = false 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;