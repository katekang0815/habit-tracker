-- Update create_daily_habit_snapshot function to include all habits (active and inactive)
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
    -- Loop through all users who have habits (removed is_active = true filter)
    FOR user_record IN 
        SELECT DISTINCT user_id
        FROM public.habits
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
        WHERE h.user_id = user_record.user_id;
        -- Removed AND h.is_active = true filter
        
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
    
    -- Clean up old habit completions after creating snapshots
    PERFORM cleanup_old_habit_completions();
END;
$function$