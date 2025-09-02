-- Set up daily cron job to create snapshots at midnight
SELECT cron.schedule(
  'create-daily-habit-snapshots',
  '0 0 * * *', -- Run at midnight every day
  'SELECT create_daily_habit_snapshot();'
);