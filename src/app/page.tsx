import HomeClient from "@/components/HomeClient";
import { supabase } from "@/lib/supabase";

export const revalidate = 60; // Revalidate every 60s for dynamic feel without heavy load

export default async function Home() {
  // 1. Fetch Top 6 Spots with their cover photos
  const { data: spots } = await supabase
    .from('spots')
    .select(`
      *,
      spot_photos!inner (
        photo_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6);

  // 3. Fetch 4 Latest Community Photos for the collage
  const { data: communityPhotos } = await supabase
    .from('spot_photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4);

  // 4. Fetch 1 Top Contributor (User with Avatar)
  const { data: highlightUsers } = await supabase
    .from('users')
    .select('*')
    .not('avatar_url', 'is', null)
    .not('full_name', 'is', null)
    .limit(1);

  const highlightUser = highlightUsers?.[0] || null;

  return (
    <HomeClient 
      spots={spots || []} 
      communityPhotos={communityPhotos || []} 
      highlightUser={highlightUser}
    />
  );
}
