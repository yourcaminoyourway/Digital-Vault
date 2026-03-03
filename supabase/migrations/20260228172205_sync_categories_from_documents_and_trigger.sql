-- ============================================================================
-- Migration: sync_categories_from_documents_and_trigger
-- Description: Trigger to auto-sync category names from documents into the
--              categories table, and backfill from existing documents.
-- ============================================================================

-- Trigger function: inserts a category row when a document is created/updated
CREATE OR REPLACE FUNCTION public.sync_category_from_document()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
begin
  if new.category is not null and trim(new.category) <> '' then
    insert into public.categories (user_id, name)
    values (new.user_id, trim(new.category))
    on conflict (user_id, lower(trim(name))) do nothing;
  end if;

  return new;
end;
$$;

-- Attach trigger to documents table (fires on INSERT or UPDATE)
CREATE TRIGGER on_document_category_sync
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_category_from_document();

-- Backfill: create categories from existing documents
INSERT INTO public.categories (user_id, name)
SELECT DISTINCT user_id, trim(category)
FROM public.documents
WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT (user_id, lower(trim(name))) DO NOTHING;
