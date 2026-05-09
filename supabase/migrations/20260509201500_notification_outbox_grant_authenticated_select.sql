-- Restore SELECT on notification_outbox for the authenticated role.
-- 20260508193000_notification_outbox.sql revoked all table privileges from authenticated;
-- 20260509180000 added an RLS policy but omitted this grant, so analytics queries failed at privilege check.

GRANT SELECT ON TABLE public.notification_outbox TO authenticated;
