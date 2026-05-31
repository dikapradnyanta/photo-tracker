export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          gear: string | null
          genres: string[] | null
          full_name: string | null
          onboarding_completed: boolean | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          gear?: string | null
          genres?: string[] | null
          full_name?: string | null
          onboarding_completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          gear?: string | null
          genres?: string[] | null
          full_name?: string | null
          onboarding_completed?: boolean | null
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          description: string
          category_tag: string
          cover_url: string
          author_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category_tag: string
          cover_url: string
          author_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category_tag?: string
          cover_url?: string
          author_id?: string | null
          created_at?: string
        }
      }
      spots: {
        Row: {
          id: string
          name: string
          description: string | null
          tips_trik: string | null
          latitude: number
          longitude: number
          genre: string[] | null
          best_time: string | null
          difficulty: string | null
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          tips_trik?: string | null
          latitude: number
          longitude: number
          genre?: string[] | null
          best_time?: string | null
          difficulty?: string | null
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          tips_trik?: string | null
          latitude?: number
          longitude?: number
          genre?: string[] | null
          best_time?: string | null
          difficulty?: string | null
          added_by?: string | null
          created_at?: string
        }
      }
      spot_photos: {
        Row: {
          id: string
          spot_id: string | null
          user_id: string | null
          photo_url: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          spot_id?: string | null
          user_id?: string | null
          photo_url: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          spot_id?: string | null
          user_id?: string | null
          photo_url?: string
          caption?: string | null
          created_at?: string
        }
      }
      spot_reviews: {
        Row: {
          id: string
          spot_id: string | null
          user_id: string | null
          rating: number | null
          comment: string | null
          visited_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          spot_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          visited_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          spot_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          visited_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

// ============================================================
// SpotWithPhoto — result type dari RPC get_spots_in_bbox
// (includes hero_photo_url dari JOIN ke spot_photos)
// ============================================================
export interface SpotWithPhoto {
  id: string
  name: string
  description: string | null
  tips_trik: string | null
  latitude: number
  longitude: number
  genre: string[] | null
  best_time: string | null
  difficulty: string | null
  hero_photo_url: string | null  // dari subquery RPC, bukan kolom langsung
  added_by: string | null
  created_at: string
  // Joined dari tabel users (di-fetch manual setelah RPC)
  added_by_username?: string | null
  added_by_avatar?: string | null
}
