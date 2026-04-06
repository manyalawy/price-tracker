-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule daily price check at 8:00 AM UTC
select cron.schedule(
  'daily-price-check',
  '0 8 * * *',
  $$
  select net.http_post(
    url := current_setting('app.extraction_api_url') || '/check-prices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-api-key', current_setting('app.extraction_api_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
