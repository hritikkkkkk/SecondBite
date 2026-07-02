-- Create private contact table for phone
CREATE TABLE public.restaurant_contact (
  restaurant_id uuid PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_contact TO authenticated;
GRANT ALL ON public.restaurant_contact TO service_role;

ALTER TABLE public.restaurant_contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can read contact" ON public.restaurant_contact
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "owner can insert contact" ON public.restaurant_contact
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "owner can update contact" ON public.restaurant_contact
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "owner can delete contact" ON public.restaurant_contact
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- Backfill existing phone data
INSERT INTO public.restaurant_contact (restaurant_id, phone)
SELECT id, phone FROM public.restaurants WHERE phone IS NOT NULL
ON CONFLICT (restaurant_id) DO NOTHING;

-- Drop phone column from restaurants (removes it from any public exposure)
ALTER TABLE public.restaurants DROP COLUMN phone;