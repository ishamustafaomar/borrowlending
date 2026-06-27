
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS trust_circle text NOT NULL DEFAULT 'block',
  ADD COLUMN IF NOT EXISTS borrow_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS co2_kg_per_borrow numeric NOT NULL DEFAULT 8;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS karma integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_circle text NOT NULL DEFAULT 'block';

CREATE OR REPLACE FUNCTION public.bump_karma_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT owner_id INTO v_owner FROM public.items WHERE id = NEW.item_id;
    IF v_owner IS NOT NULL THEN
      UPDATE public.profiles SET karma = karma + 5 WHERE id = v_owner;
      UPDATE public.profiles SET karma = karma + 1 WHERE id = NEW.borrower_id;
    END IF;
    UPDATE public.items SET borrow_count = borrow_count + 1 WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_karma_on_approval ON public.borrows;
CREATE TRIGGER trg_bump_karma_on_approval
  AFTER UPDATE ON public.borrows
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_karma_on_approval();
