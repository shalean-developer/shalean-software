-- Enum values only (must commit before any function references new labels — see next migration).

DO $migrate$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'booking_status'
      AND e.enumlabel = 'cleaner_arrived'
  ) THEN
    ALTER TYPE public.booking_status ADD VALUE 'cleaner_arrived' AFTER 'cleaner_en_route';
  END IF;
END
$migrate$;

DO $migrate$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'booking_event_type'
      AND e.enumlabel = 'CLEANER_ARRIVED'
  ) THEN
    ALTER TYPE public.booking_event_type ADD VALUE 'CLEANER_ARRIVED' AFTER 'CLEANER_EN_ROUTE';
  END IF;
END
$migrate$;
