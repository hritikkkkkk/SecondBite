
-- Restrict base table SELECT to owners only; expose safe columns via a public view.
DROP POLICY IF EXISTS "public can view restaurants" ON public.restaurants;

CREATE POLICY "owner can view restaurant"
  ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Public-safe view (excludes phone and owner_id).
CREATE OR REPLACE VIEW public.restaurants_public
WITH (security_invoker = true) AS
SELECT id, slug, name, logo_url, cuisine, address, opening_hours,
       qr_color, qr_frame_text, reward_text, created_at
FROM public.restaurants;

-- The view needs a permissive policy on the base table for anon/authenticated
-- to see rows through it. Add a column-safe public SELECT policy on the base
-- table too; combined with revoking phone column privileges, phone stays hidden.
CREATE POLICY "public can view restaurants safe columns"
  ON public.restaurants
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Revoke column privileges so anon/authenticated cannot read phone directly.
REVOKE SELECT ON public.restaurants FROM anon, authenticated;
GRANT SELECT (id, slug, owner_id, name, logo_url, cuisine, address,
              opening_hours, qr_color, qr_frame_text, reward_text, created_at)
  ON public.restaurants TO anon, authenticated;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;
