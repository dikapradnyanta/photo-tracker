-- Add missing DELETE and UPDATE policies for spots
DROP POLICY IF EXISTS "Users can delete their own spots." ON public.spots;
CREATE POLICY "Users can delete their own spots." ON public.spots FOR DELETE USING (auth.uid() = added_by);

-- Add missing DELETE and UPDATE policies for spot_photos
DROP POLICY IF EXISTS "Users can update their own photos." ON public.spot_photos;
CREATE POLICY "Users can update their own photos." ON public.spot_photos FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own photos." ON public.spot_photos;
CREATE POLICY "Users can delete their own photos." ON public.spot_photos FOR DELETE USING (auth.uid() = user_id);

-- Update storage policies for photos bucket just in case UPDATE is needed (optional, but good for completeness)
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
