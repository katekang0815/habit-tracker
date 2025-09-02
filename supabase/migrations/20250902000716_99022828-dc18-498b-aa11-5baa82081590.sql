-- Create habit_snapshots table
CREATE TABLE IF NOT EXISTS public.habit_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    habits_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one snapshot per user per date
    CONSTRAINT unique_user_date UNIQUE (user_id, snapshot_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_habit_snapshots_user_id ON public.habit_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_snapshots_snapshot_date ON public.habit_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_habit_snapshots_user_date ON public.habit_snapshots(user_id, snapshot_date);

-- Enable Row Level Security
ALTER TABLE public.habit_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own habit snapshots" ON public.habit_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit snapshots" ON public.habit_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit snapshots" ON public.habit_snapshots
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit snapshots" ON public.habit_snapshots
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.habit_snapshots IS 'Stores static historical habit completion data in JSONB format';
COMMENT ON COLUMN public.habit_snapshots.habits_data IS 'JSONB containing array of habits with their completion status, names, and other metadata';

-- Create migration functions
CREATE OR REPLACE FUNCTION migrate_historical_habits_to_snapshots()
RETURNS void AS $$
DECLARE
    completion_record RECORD;
    current_user_id UUID;
    current_date DATE;
    habits_array JSONB;
BEGIN
    -- Loop through all historical records (excluding today)
    FOR completion_record IN 
        SELECT DISTINCT user_id, completion_date::DATE as date
        FROM public.habit_completions
        WHERE completion_date::DATE < CURRENT_DATE
        ORDER BY user_id, date
    LOOP
        current_user_id := completion_record.user_id;
        current_date := completion_record.date;
        
        -- Build JSONB array of habits for this user and date
        SELECT jsonb_agg(
            jsonb_build_object(
                'habit_id', hc.habit_id,
                'habit_name', h.name,
                'completed', hc.completed,
                'completion_date', hc.completion_date,
                'created_at', hc.created_at,
                'updated_at', hc.updated_at,
                'is_paused', h.is_paused,
                'is_deleted', h.is_deleted
            )
            ORDER BY h.created_at
        ) INTO habits_array
        FROM public.habit_completions hc
        JOIN public.habits h ON h.id = hc.habit_id
        WHERE hc.user_id = current_user_id
        AND hc.completion_date::DATE = current_date;
        
        -- Insert into habit_snapshots if data exists
        IF habits_array IS NOT NULL THEN
            INSERT INTO public.habit_snapshots (user_id, snapshot_date, habits_data)
            VALUES (current_user_id, current_date, habits_array)
            ON CONFLICT (user_id, snapshot_date) 
            DO UPDATE SET 
                habits_data = EXCLUDED.habits_data,
                created_at = NOW();
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_daily_habit_snapshot()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    habits_array JSONB;
    yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    -- Loop through all users who have habits
    FOR user_record IN 
        SELECT DISTINCT user_id
        FROM public.habits
        WHERE is_deleted = false
    LOOP
        -- Build JSONB array of habits for yesterday
        SELECT jsonb_agg(
            jsonb_build_object(
                'habit_id', hc.habit_id,
                'habit_name', h.name,
                'completed', COALESCE(hc.completed, false),
                'completion_date', yesterday,
                'is_paused', h.is_paused,
                'is_deleted', h.is_deleted
            )
            ORDER BY h.created_at
        ) INTO habits_array
        FROM public.habits h
        LEFT JOIN public.habit_completions hc 
            ON h.id = hc.habit_id 
            AND hc.user_id = user_record.user_id
            AND hc.completion_date::DATE = yesterday
        WHERE h.user_id = user_record.user_id
        AND h.is_deleted = false;
        
        -- Insert snapshot if habits exist
        IF habits_array IS NOT NULL THEN
            INSERT INTO public.habit_snapshots (user_id, snapshot_date, habits_data)
            VALUES (user_record.user_id, yesterday, habits_array)
            ON CONFLICT (user_id, snapshot_date) 
            DO UPDATE SET 
                habits_data = EXCLUDED.habits_data,
                created_at = NOW();
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_habit_completions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.habit_completions
    WHERE completion_date::DATE < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Add function comments
COMMENT ON FUNCTION migrate_historical_habits_to_snapshots() IS 'One-time migration function to move historical data from habit_completions to habit_snapshots';
COMMENT ON FUNCTION create_daily_habit_snapshot() IS 'Creates daily snapshots of habit data for all users (to be run by cron job)';
COMMENT ON FUNCTION cleanup_old_habit_completions() IS 'Removes historical data from habit_completions table, keeping only today''s data';