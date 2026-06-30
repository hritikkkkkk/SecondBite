
DROP POLICY IF EXISTS "anyone can submit review" ON public.reviews;
CREATE POLICY "anyone can submit review" ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = reviews.restaurant_id));
