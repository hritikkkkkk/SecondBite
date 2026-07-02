
-- 1) Remove overly broad public SELECT on restaurants (public reads go via restaurants_public view)
DROP POLICY IF EXISTS "public can view restaurants safe columns" ON public.restaurants;
REVOKE SELECT ON public.restaurants FROM anon;

-- 2) Server-side review submission with CSPRNG reward code
CREATE OR REPLACE FUNCTION public.submit_review(
  p_restaurant_slug text,
  p_rating_food int,
  p_rating_service int,
  p_rating_ambience int,
  p_tags text[],
  p_comment text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id uuid;
  v_code text;
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  i int;
BEGIN
  IF p_rating_food NOT BETWEEN 1 AND 5
     OR p_rating_service NOT BETWEEN 1 AND 5
     OR p_rating_ambience NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Invalid rating value';
  END IF;

  IF p_comment IS NOT NULL AND length(p_comment) > 1000 THEN
    RAISE EXCEPTION 'Comment too long';
  END IF;

  SELECT id INTO v_restaurant_id
  FROM public.restaurants
  WHERE slug = p_restaurant_slug;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Restaurant not found';
  END IF;

  -- Cryptographically secure 5-char code from pgcrypto
  v_bytes := extensions.gen_random_bytes(5);
  v_code := 'SB-';
  FOR i IN 0..4 LOOP
    v_code := v_code || substr(v_chars, (get_byte(v_bytes, i) % length(v_chars)) + 1, 1);
  END LOOP;

  INSERT INTO public.reviews (
    restaurant_id, rating_food, rating_service, rating_ambience,
    tags, comment, reward_code
  ) VALUES (
    v_restaurant_id,
    p_rating_food, p_rating_service, p_rating_ambience,
    COALESCE(p_tags, '{}'::text[]),
    NULLIF(btrim(COALESCE(p_comment, '')), ''),
    v_code
  );

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_review(text,int,int,int,text[],text) TO anon, authenticated;

-- 3) Remove direct client INSERT path so codes must be generated server-side
DROP POLICY IF EXISTS "anyone can submit review" ON public.reviews;
REVOKE INSERT ON public.reviews FROM anon, authenticated;
