-- Migration: auto_delete_spots_without_photos
-- Spots cannot be manually deleted by users, so we auto-cleanup spots
-- that end up with zero photos (e.g. failed uploads during add-spot flow).

-- 1. One-time cleanup: delete any existing orphan spots with no photos
DELETE FROM spots
WHERE id NOT IN (
  SELECT DISTINCT spot_id FROM spot_photos WHERE spot_id IS NOT NULL
);

-- 2. Trigger function: after a photo is deleted, check if its spot is now empty
CREATE OR REPLACE FUNCTION delete_spot_if_no_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.spot_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM spot_photos WHERE spot_id = OLD.spot_id
    ) THEN
      DELETE FROM spots WHERE id = OLD.spot_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

-- 3. Attach trigger to spot_photos table
DROP TRIGGER IF EXISTS auto_delete_spot_without_photos ON spot_photos;

CREATE TRIGGER auto_delete_spot_without_photos
  AFTER DELETE ON spot_photos
  FOR EACH ROW
  EXECUTE FUNCTION delete_spot_if_no_photos();
