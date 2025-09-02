-- Create helper function to get current Pacific date
CREATE OR REPLACE FUNCTION public.current_pacific_date()
RETURNS DATE AS $$
BEGIN
    RETURN (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to convert UTC timestamp to Pacific date
CREATE OR REPLACE FUNCTION public.utc_to_pacific_date(utc_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS DATE AS $$
BEGIN
    RETURN (utc_timestamp AT TIME ZONE 'America/Los_Angeles')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Update create_daily_habit_snapshot function to use Pacific timezone
CREATE OR REPLACE FUNCTION public.create_daily_habit_snapshot()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    user_record RECORD;
    habits_array JSONB;
    yesterday_pacific DATE := current_pacific_date() - INTERVAL '1 day';
BEGIN
    -- Loop through all users who have habits
    FOR user_record IN 
        SELECT DISTINCT user_id
        FROM public.habits
        WHERE is_active = true
    LOOP
        -- Build JSONB array of habits for yesterday (Pacific time)
        SELECT jsonb_agg(
            jsonb_build_object(
                'habit_id', hc.habit_id,
                'habit_name', h.name,
                'completed', COALESCE(hc.completed, false),
                'completion_date', yesterday_pacific,
                'is_active', h.is_active
            )
            ORDER BY h.created_at
        ) INTO habits_array
        FROM public.habits h
        LEFT JOIN public.habit_completions hc 
            ON h.id = hc.habit_id 
            AND hc.user_id = user_record.user_id
            AND hc.completion_date = yesterday_pacific
        WHERE h.user_id = user_record.user_id
        AND h.is_active = true;
        
        -- Insert snapshot if habits exist
        IF habits_array IS NOT NULL THEN
            INSERT INTO public.habit_snapshots (user_id, snapshot_date, habits_data)
            VALUES (user_record.user_id, yesterday_pacific, habits_array)
            ON CONFLICT (user_id, snapshot_date) 
            DO UPDATE SET 
                habits_data = EXCLUDED.habits_data,
                created_at = NOW();
        END IF;
    END LOOP;
END;
$function$;

-- Update cleanup function to use Pacific timezone
CREATE OR REPLACE FUNCTION public.cleanup_old_habit_completions()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.habit_completions
    WHERE completion_date < current_pacific_date();
END;
$function$;

-- Update migration function to handle Pacific timezone dates
CREATE OR REPLACE FUNCTION public.migrate_historical_habits_to_snapshots()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    completion_record RECORD;
    current_user_id UUID;
    target_date DATE;
    habits_array JSONB;
BEGIN
    -- Loop through all historical records (excluding today in Pacific time)
    FOR completion_record IN 
        SELECT DISTINCT user_id, completion_date as date
        FROM public.habit_completions
        WHERE completion_date < current_pacific_date()
        ORDER BY user_id, date
    LOOP
        current_user_id := completion_record.user_id;
        target_date := completion_record.date;
        
        -- Build JSONB array of habits for this user and date
        SELECT jsonb_agg(
            jsonb_build_object(
                'habit_id', hc.habit_id,
                'habit_name', h.name,
                'completed', hc.completed,
                'completion_date', hc.completion_date,
                'created_at', hc.created_at,
                'updated_at', hc.updated_at,
                'is_active', h.is_active
            )
            ORDER BY h.created_at
        ) INTO habits_array
        FROM public.habit_completions hc
        JOIN public.habits h ON h.id = hc.habit_id
        WHERE hc.user_id = current_user_id
        AND hc.completion_date = target_date;
        
        -- Insert into habit_snapshots if data exists
        IF habits_array IS NOT NULL THEN
            INSERT INTO public.habit_snapshots (user_id, snapshot_date, habits_data)
            VALUES (current_user_id, target_date, habits_array)
            ON CONFLICT (user_id, snapshot_date) 
            DO UPDATE SET 
                habits_data = EXCLUDED.habits_data,
                created_at = NOW();
        END IF;
    END LOOP;
END;
$function$;