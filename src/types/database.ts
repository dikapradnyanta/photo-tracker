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
          created_at?: string
        }
      }
      spots: {
        Row: {
          id: string
          name: string
          description: string | null
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
