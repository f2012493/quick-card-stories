export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author: string | null
          category: string | null
          clickbait_score: number | null
          content: string | null
          content_embedding: string | null
          content_hash: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          ingested_at: string | null
          published_at: string
          quality_score: number | null
          region_tags: string[] | null
          source_id: string | null
          status: Database["public"]["Enums"]["article_status"] | null
          title: string
          title_embedding: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          clickbait_score?: number | null
          content?: string | null
          content_embedding?: string | null
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingested_at?: string | null
          published_at: string
          quality_score?: number | null
          region_tags?: string[] | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          title: string
          title_embedding?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          author?: string | null
          category?: string | null
          clickbait_score?: number | null
          content?: string | null
          content_embedding?: string | null
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingested_at?: string | null
          published_at?: string
          quality_score?: number | null
          region_tags?: string[] | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          title?: string
          title_embedding?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_articles: {
        Row: {
          added_at: string | null
          article_id: string | null
          cluster_id: string | null
          id: string
          is_representative: boolean | null
          similarity_score: number | null
        }
        Insert: {
          added_at?: string | null
          article_id?: string | null
          cluster_id?: string | null
          id?: string
          is_representative?: boolean | null
          similarity_score?: number | null
        }
        Update: {
          added_at?: string | null
          article_id?: string | null
          cluster_id?: string | null
          id?: string
          is_representative?: boolean | null
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cluster_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_articles_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "story_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          name: string
          trust_level: Database["public"]["Enums"]["source_trust_level"] | null
          trust_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          name: string
          trust_level?: Database["public"]["Enums"]["source_trust_level"] | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          name?: string
          trust_level?: Database["public"]["Enums"]["source_trust_level"] | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      personalized_feeds: {
        Row: {
          cluster_id: string | null
          expires_at: string | null
          generated_at: string | null
          id: string
          personalized_score: number
          rank_position: number | null
          user_id: string | null
        }
        Insert: {
          cluster_id?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          personalized_score: number
          rank_position?: number | null
          user_id?: string | null
        }
        Update: {
          cluster_id?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          personalized_score?: number
          rank_position?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personalized_feeds_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "story_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      story_clusters: {
        Row: {
          article_count: number | null
          authority_score: number | null
          base_score: number | null
          category: string | null
          created_at: string | null
          description: string | null
          earliest_published_at: string | null
          expires_at: string | null
          freshness_score: number | null
          id: string
          latest_published_at: string | null
          newsworthiness_score: number | null
          originality_score: number | null
          quality_score: number | null
          region_tags: string[] | null
          representative_image_url: string | null
          status: Database["public"]["Enums"]["cluster_status"] | null
          title: string
          trending_regions: string[] | null
          updated_at: string | null
        }
        Insert: {
          article_count?: number | null
          authority_score?: number | null
          base_score?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          earliest_published_at?: string | null
          expires_at?: string | null
          freshness_score?: number | null
          id?: string
          latest_published_at?: string | null
          newsworthiness_score?: number | null
          originality_score?: number | null
          quality_score?: number | null
          region_tags?: string[] | null
          representative_image_url?: string | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          title: string
          trending_regions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          article_count?: number | null
          authority_score?: number | null
          base_score?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          earliest_published_at?: string | null
          expires_at?: string | null
          freshness_score?: number | null
          id?: string
          latest_published_at?: string | null
          newsworthiness_score?: number | null
          originality_score?: number | null
          quality_score?: number | null
          region_tags?: string[] | null
          representative_image_url?: string | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          title?: string
          trending_regions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          language_preferences: string[] | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          preferred_categories: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          language_preferences?: string[] | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          preferred_categories?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language_preferences?: string[] | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          preferred_categories?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_reading_history: {
        Row: {
          article_id: string | null
          cluster_id: string | null
          created_at: string | null
          id: string
          interaction_type: string | null
          read_at: string | null
          read_duration_seconds: number | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          read_at?: string | null
          read_duration_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          read_at?: string | null
          read_duration_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_history_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "story_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_preferences: {
        Row: {
          created_at: string | null
          id: string
          interaction_count: number | null
          last_interaction_at: string | null
          preference_score: number | null
          topic_keyword: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          preference_score?: number | null
          topic_keyword: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          preference_score?: number | null
          topic_keyword?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_subscription_status: {
        Args: { user_id: string; status: string }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      article_status: "active" | "stale" | "archived"
      cluster_status: "active" | "trending" | "stale" | "archived"
      source_trust_level: "low" | "medium" | "high" | "verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      article_status: ["active", "stale", "archived"],
      cluster_status: ["active", "trending", "stale", "archived"],
      source_trust_level: ["low", "medium", "high", "verified"],
    },
  },
} as const
