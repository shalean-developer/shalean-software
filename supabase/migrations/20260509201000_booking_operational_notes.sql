-- Append-only internal notes for dispatcher/admin support & ops context.
-- Not shown to customers; complements bookings.internal_notes (editable snapshot field).

CREATE TYPE public.booking_operational_note_kind AS ENUM ('support', 'operations');

CREATE TABLE public.booking_operational_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  note_kind public.booking_operational_note_kind NOT NULL DEFAULT 'support',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_operational_notes_body_len_chk CHECK (
    char_length(trim(body)) > 0 AND char_length(body) <= 8000
  )
);

CREATE INDEX booking_operational_notes_booking_created_idx
  ON public.booking_operational_notes (booking_id, created_at DESC);

COMMENT ON TABLE public.booking_operational_notes IS
  'Staff-only append-only annotations per booking; audit via created_at + author.';

ALTER TABLE public.booking_operational_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_operational_notes_select_dispatcher_admin
  ON public.booking_operational_notes
  FOR SELECT
  TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

CREATE POLICY booking_operational_notes_insert_dispatcher_admin_self
  ON public.booking_operational_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.jwt_is_dispatcher_or_admin()
    AND author_user_id = auth.uid()
  );

REVOKE ALL ON TABLE public.booking_operational_notes FROM PUBLIC;
REVOKE ALL ON TABLE public.booking_operational_notes FROM anon;

GRANT SELECT, INSERT ON TABLE public.booking_operational_notes TO authenticated;

CREATE OR REPLACE FUNCTION public.booking_operational_notes_prevent_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'booking_operational_notes are append-only (id=%)', OLD.id
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER booking_operational_notes_no_update
BEFORE UPDATE ON public.booking_operational_notes
FOR EACH ROW
EXECUTE FUNCTION public.booking_operational_notes_prevent_update();
