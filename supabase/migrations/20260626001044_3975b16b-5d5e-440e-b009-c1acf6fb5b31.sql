
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT 'oklch(0.7 0.16 32)',
  distance_mi NUMERIC NOT NULL DEFAULT 0,
  doors_away TEXT NOT NULL DEFAULT 'Right here',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by signed in" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- items
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_display_name TEXT NOT NULL,
  owner_avatar_color TEXT NOT NULL DEFAULT 'oklch(0.7 0.16 32)',
  distance_mi NUMERIC NOT NULL DEFAULT 0.2,
  doors_away TEXT NOT NULL DEFAULT 'Down the block',
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  category TEXT NOT NULL DEFAULT 'tools',
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL DEFAULT 'Available this week',
  availability_tags TEXT[] NOT NULL DEFAULT '{}',
  estimated_value NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items viewable by signed in" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own items" ON public.items FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own items" ON public.items FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Users delete own items" ON public.items FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- borrows
CREATE TYPE public.borrow_status AS ENUM ('pending','approved','declined','completed');
CREATE TABLE public.borrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dates TEXT NOT NULL DEFAULT 'Flexible',
  message TEXT NOT NULL DEFAULT '',
  status public.borrow_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.borrows TO authenticated;
GRANT ALL ON public.borrows TO service_role;
ALTER TABLE public.borrows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Borrower sees own borrows" ON public.borrows FOR SELECT TO authenticated
  USING (auth.uid() = borrower_id OR auth.uid() IN (SELECT owner_id FROM public.items WHERE id = item_id));
CREATE POLICY "Users create borrows as themselves" ON public.borrows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = borrower_id);
CREATE POLICY "Borrower or owner update borrow" ON public.borrows FOR UPDATE TO authenticated
  USING (auth.uid() = borrower_id OR auth.uid() IN (SELECT owner_id FROM public.items WHERE id = item_id));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_color, distance_mi, doors_away)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Neighbor'),
    'oklch(0.7 0.16 32)',
    0,
    'Right here'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed 14 demo items (owner_id NULL = demo neighbor)
INSERT INTO public.items (owner_display_name, owner_avatar_color, distance_mi, doors_away, name, emoji, category, synonyms, availability, availability_tags, estimated_value) VALUES
  ('Maria',   'oklch(0.7 0.16 32)',  0.02, '2 doors down',   'Pressure Washer',   '🧽', 'outdoor', ARRAY['pressure washer','power washer','jet washer','washer'], 'Free this weekend',        ARRAY['weekend','saturday','sunday'], 320),
  ('James',   'oklch(0.65 0.15 250)',0.1,  '4 houses over',  'Cordless Drill',    '🔧', 'tools',   ARRAY['cordless drill','drill','power drill','dewalt'], 'Available evenings',        ARRAY['tonight','weekday','evening'], 140),
  ('Priya',   'oklch(0.7 0.17 150)', 0.3,  'across the park','Extension Ladder',  '🪜', 'tools',   ARRAY['extension ladder','ladder','tall ladder','step ladder'], 'Free anytime',         ARRAY['today','tomorrow','weekend','weekday'], 220),
  ('Tom',     'oklch(0.65 0.16 60)', 0.2,  '3 houses over',  'Stand Mixer',       '🥣', 'kitchen', ARRAY['stand mixer','mixer','kitchenaid','dough mixer'], 'Free this weekend',         ARRAY['weekend','saturday','sunday'], 380),
  ('Sofia',   'oklch(0.68 0.18 320)',0.4,  'corner house',   'Camping Tent (4p)', '⛺', 'outdoor', ARRAY['tent','camping tent','4 person tent'], 'Free in 2 weeks',                     ARRAY['next week','weekend'], 260),
  ('Andre',   'oklch(0.6 0.15 200)', 0.15, '5 doors down',   'Hedge Trimmer',     '🌿', 'outdoor', ARRAY['hedge trimmer','trimmer','hedge cutter','shears'], 'Free weekdays',            ARRAY['weekday','today','tomorrow'], 110),
  ('Lena',    'oklch(0.7 0.16 0)',   0.25, 'two streets up', 'Carpet Cleaner',    '🧼', 'home',    ARRAY['carpet cleaner','rug cleaner','steam cleaner','bissell'], 'Free this Sunday',     ARRAY['sunday','weekend'], 180),
  ('Marcus',  'oklch(0.6 0.18 280)', 0.18, '6 doors down',   'Projector',         '📽️','tech',    ARRAY['projector','movie projector','beamer','hdmi projector'], 'Free weekends',         ARRAY['weekend','friday','saturday','sunday'], 420),
  ('Hannah',  'oklch(0.72 0.15 100)',0.22, 'around the bend','Folding Tables (x4)','🪑', 'home',   ARRAY['folding tables','tables','party tables','banquet tables'], 'Free this weekend',    ARRAY['weekend','saturday','sunday'], 160),
  ('Ravi',    'oklch(0.62 0.17 30)', 0.12, '3 doors down',   'Kids'' Bike (16")', '🚲', 'outdoor', ARRAY['kids bike','bike','child bike','bicycle'], 'Available anytime',                ARRAY['today','tomorrow','weekend','weekday'], 130),
  ('Beatriz', 'oklch(0.68 0.16 340)',0.28, 'two doors over', 'Sewing Machine',    '🧵', 'craft',   ARRAY['sewing machine','singer','sewing','seamstress'], 'Free weeknights',            ARRAY['evening','weekday','tonight'], 240),
  ('Diego',   'oklch(0.6 0.16 240)', 0.08, 'next door',      'Jigsaw',            '🪚', 'tools',   ARRAY['jigsaw','saw','power saw','wood saw'], 'Free this weekend',                   ARRAY['weekend','saturday','sunday'], 90),
  ('Owen',    'oklch(0.65 0.15 140)',0.34, 'past the cafe',  'Wheelbarrow',       '🛞', 'outdoor', ARRAY['wheelbarrow','barrow','garden cart','cart'], 'Available anytime',              ARRAY['today','tomorrow','weekend','weekday'], 70),
  ('Eleanor', 'oklch(0.7 0.17 80)',  0.16, '4 doors up',     'KitchenAid Mixer',  '🎂', 'kitchen', ARRAY['kitchenaid','kitchen aid','stand mixer','baking mixer'], 'Free Sat afternoon', ARRAY['saturday','weekend'], 400);
