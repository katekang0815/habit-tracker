-- Step 1: Clean up invalid social shares (users without LinkedIn URLs)
UPDATE public.social_shares 
SET is_active = false 
WHERE user_id IN (
  SELECT ss.user_id 
  FROM public.social_shares ss
  LEFT JOIN public.profiles p ON ss.user_id = p.user_id
  WHERE ss.is_active = true 
  AND (p.linkedin IS NULL OR p.linkedin = '')
);

-- Step 2: Create function to ensure data consistency
CREATE OR REPLACE FUNCTION public.validate_social_share_linkedin()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to enforce LinkedIn requirement
CREATE TRIGGER validate_social_share_before_update
  BEFORE INSERT OR UPDATE ON public.social_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_social_share_linkedin();

-- Step 4: Create function to automatically deactivate shares when LinkedIn is removed
CREATE OR REPLACE FUNCTION public.deactivate_share_on_linkedin_removal()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger on profiles to auto-deactivate shares
CREATE TRIGGER deactivate_share_on_linkedin_removal_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_share_on_linkedin_removal();