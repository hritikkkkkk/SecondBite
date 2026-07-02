GRANT SELECT (id, slug, name, logo_url, cuisine, address, opening_hours, qr_color, qr_frame_text, reward_text, created_at) ON public.restaurants TO anon;
GRANT SELECT (id, slug, name, logo_url, cuisine, address, opening_hours, qr_color, qr_frame_text, reward_text, created_at) ON public.restaurants TO authenticated;

DROP POLICY IF EXISTS "public can read safe restaurant columns" ON public.restaurants;
CREATE POLICY "public can read safe restaurant columns"
ON public.restaurants
FOR SELECT
TO anon, authenticated
USING (true);