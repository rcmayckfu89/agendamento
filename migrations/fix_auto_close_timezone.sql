-- Migration: Fix auto-closure timezone and schedule
-- Applied: 2026-02-04
-- Author: Antigravity

-- Update the auto-closure function to use Brazil/Sao_Paulo timezone
CREATE OR REPLACE FUNCTION public.auto_close_yesterday_appointments()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Use America/Sao_Paulo timezone to determine the local "today"
    UPDATE public.appointments
    SET status = 'auto_closed'
    WHERE status = 'scheduled'
      AND date < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date;
END;
$function$;

-- Update the cron schedule to run at 00:01 local time (03:01 UTC)
-- Note: Requires pg_cron extension
SELECT cron.unschedule('auto-close-appointments');
SELECT cron.schedule(
    'auto-close-appointments',
    '1 3 * * *', -- 03:01 UTC = 00:01 America/Sao_Paulo
    'SELECT public.auto_close_yesterday_appointments()'
);
