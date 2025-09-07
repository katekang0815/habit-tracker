-- Update the daily habit snapshot cron job to run at midnight Pacific time
-- 8:00 AM UTC ensures it's always after midnight Pacific (accounts for both PDT and PST)

-- First, unschedule the existing cron job
SELECT cron.unschedule('create-daily-habit-snapshots');

-- Schedule the cron job to run at 8:00 AM UTC (midnight or later Pacific time)
SELECT cron.schedule(
  'create-daily-habit-snapshots',
  '0 8 * * *', -- Run at 8:00 AM UTC every day
  'SELECT create_daily_habit_snapshot();'
);

-- Add a comment explaining the timezone consideration
COMMENT ON FUNCTION create_daily_habit_snapshot() IS 'Creates daily snapshots of habit data for all users. Runs at 8:00 AM UTC (after midnight Pacific time) to ensure the full day is captured.';
