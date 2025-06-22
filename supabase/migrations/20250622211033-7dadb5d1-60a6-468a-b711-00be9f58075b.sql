
-- Enable pg_cron extension for scheduled jobs
SELECT cron.schedule(
  'ingest-news-every-5-minutes',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://jdtqgaetldlxhvjojfze.supabase.co/functions/v1/ingest-news',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdHFnYWV0bGRseGh2am9qZnplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE0MTYxNSwiZXhwIjoyMDY1NzE3NjE1fQ.VkJBcr6vWKgZpLgn2rqLvLJdQcJJ4rZ7r8dNf6aNu2Y"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Also create a cleanup job that runs every hour to remove stale data
SELECT cron.schedule(
  'cleanup-stale-data-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://jdtqgaetldlxhvjojfze.supabase.co/functions/v1/cleanup-stale-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdHFnYWV0bGRseGh2am9qZnplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE0MTYxNSwiZXhwIjoyMDY1NzE3NjE1fQ.VkJBcr6vWKgZpLgn2rqLvLJdQcJJ4rZ7r8dNf6aNu2Y"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);
