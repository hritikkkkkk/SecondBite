
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- restaurants
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  cuisine TEXT,
  address TEXT,
  phone TEXT,
  opening_hours TEXT,
  qr_color TEXT DEFAULT '#1a1a1a',
  qr_frame_text TEXT DEFAULT 'Scan to share your experience',
  reward_text TEXT DEFAULT 'Get 10% off your next visit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX restaurants_owner_idx ON public.restaurants(owner_id);
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
-- Public read so the customer review page works without login
CREATE POLICY "public can view restaurants" ON public.restaurants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owner can insert restaurant" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner can update restaurant" ON public.restaurants FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner can delete restaurant" ON public.restaurants FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  rating_food INT NOT NULL CHECK (rating_food BETWEEN 1 AND 5),
  rating_service INT NOT NULL CHECK (rating_service BETWEEN 1 AND 5),
  rating_ambience INT NOT NULL CHECK (rating_ambience BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  reward_code TEXT NOT NULL UNIQUE,
  reward_redeemed BOOLEAN NOT NULL DEFAULT false,
  reward_redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reviews_restaurant_idx ON public.reviews(restaurant_id, created_at DESC);
CREATE INDEX reviews_reward_code_idx ON public.reviews(reward_code);
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- Anyone can submit a review
CREATE POLICY "anyone can submit review" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Only the restaurant owner can read their reviews
CREATE POLICY "owner can read reviews" ON public.reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = reviews.restaurant_id AND r.owner_id = auth.uid()));
-- Only the owner can update (e.g. mark redeemed)
CREATE POLICY "owner can update reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = reviews.restaurant_id AND r.owner_id = auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
