-- Fix search_path for helper functions
CREATE OR REPLACE FUNCTION public.current_pacific_date()
RETURNS DATE 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;
END;
$$;

-- Fix search_path for UTC to Pacific conversion function  
CREATE OR REPLACE FUNCTION public.utc_to_pacific_date(utc_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS DATE 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN (utc_timestamp AT TIME ZONE 'America/Los_Angeles')::DATE;
END;
$$;