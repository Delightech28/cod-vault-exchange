export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          evidence_files: string[] | null
          id: string
          opened_by: string
          reason: string
          resolution_notes: string | null
          resolution_outcome: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          evidence_files?: string[] | null
          id?: string
          opened_by: string
          reason: string
          resolution_notes?: string | null
          resolution_outcome?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          evidence_files?: string[] | null
          id?: string
          opened_by?: string
          reason?: string
          resolution_notes?: string | null
          resolution_outcome?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_tracking: {
        Row: {
          device_fingerprint: string | null
          email: string | null
          flagged_at: string
          id: string
          ip_address: string | null
          is_fraud: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          suspicious_activity: string | null
          user_id: string | null
        }
        Insert: {
          device_fingerprint?: string | null
          email?: string | null
          flagged_at?: string
          id?: string
          ip_address?: string | null
          is_fraud?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          suspicious_activity?: string | null
          user_id?: string | null
        }
        Update: {
          device_fingerprint?: string | null
          email?: string | null
          flagged_at?: string
          id?: string
          ip_address?: string | null
          is_fraud?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          suspicious_activity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          document_type: string
          file_path: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["kyc_status"] | null
          uploaded_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_type: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          uploaded_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_type?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          uploaded_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          created_at: string
          description: string
          game_name: string
          id: string
          items_included: string[] | null
          kd_ratio: string | null
          level: number | null
          playtime: string | null
          price: number
          proof_documents: string[] | null
          rank: string | null
          requires_verification: boolean | null
          screenshots: string[] | null
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"] | null
          status_reason: string | null
          title: string
          total_wins: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          views_count: number | null
        }
        Insert: {
          created_at?: string
          description: string
          game_name: string
          id?: string
          items_included?: string[] | null
          kd_ratio?: string | null
          level?: number | null
          playtime?: string | null
          price: number
          proof_documents?: string[] | null
          rank?: string | null
          requires_verification?: boolean | null
          screenshots?: string[] | null
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          status_reason?: string | null
          title: string
          total_wins?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          views_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          game_name?: string
          id?: string
          items_included?: string[] | null
          kd_ratio?: string | null
          level?: number | null
          playtime?: string | null
          price?: number
          proof_documents?: string[] | null
          rank?: string | null
          requires_verification?: boolean | null
          screenshots?: string[] | null
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          status_reason?: string | null
          title?: string
          total_wins?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_system_message: boolean | null
          read_by: string[] | null
          sender_id: string
          transaction_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          read_by?: string[] | null
          sender_id: string
          transaction_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          read_by?: string[] | null
          sender_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          average_rating: number | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_verified_seller: boolean | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          kyc_verified_at: string | null
          onboarding_completed: boolean | null
          phone_number: string | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          review_count: number | null
          timezone: string | null
          tour_completed: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          wallet_balance: number | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          average_rating?: number | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_verified_seller?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          kyc_verified_at?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          review_count?: number | null
          timezone?: string | null
          tour_completed?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          wallet_balance?: number | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          average_rating?: number | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_verified_seller?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          kyc_verified_at?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          review_count?: number | null
          timezone?: string | null
          tour_completed?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          acceptance_deadline: string | null
          amount: number
          auto_release_at: string | null
          buyer_id: string
          buyer_ip: string | null
          created_at: string
          delivered_at: string | null
          delivery_confirmed_at: string | null
          escrow_held_at: string | null
          funds_released_at: string | null
          id: string
          listing_id: string
          payment_intent_id: string | null
          platform_fee: number | null
          seller_id: string
          seller_ip: string | null
          seller_payout: number | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          updated_at: string
        }
        Insert: {
          acceptance_deadline?: string | null
          amount: number
          auto_release_at?: string | null
          buyer_id: string
          buyer_ip?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_confirmed_at?: string | null
          escrow_held_at?: string | null
          funds_released_at?: string | null
          id?: string
          listing_id: string
          payment_intent_id?: string | null
          platform_fee?: number | null
          seller_id: string
          seller_ip?: string | null
          seller_payout?: number | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string
        }
        Update: {
          acceptance_deadline?: string | null
          amount?: number
          auto_release_at?: string | null
          buyer_id?: string
          buyer_ip?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_confirmed_at?: string | null
          escrow_held_at?: string | null
          funds_released_at?: string | null
          id?: string
          listing_id?: string
          payment_intent_id?: string | null
          platform_fee?: number | null
          seller_id?: string
          seller_ip?: string | null
          seller_payout?: number | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          ip_address: string | null
          metadata: Json | null
          payment_method: string | null
          provider: string
          reference: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          payment_method?: string | null
          provider: string
          reference: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          payment_method?: string | null
          provider?: string
          reference?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          display_name: string
          full_name: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_views: {
        Args: { listing_id: string }
        Returns: undefined
      }
      increment_wallet_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      is_admin_or_moderator: { Args: { _user_id: string }; Returns: boolean }
      mark_messages_as_read: {
        Args: { p_transaction_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "buyer" | "seller" | "both"
      app_role: "admin" | "moderator" | "user"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_buyer"
        | "resolved_seller"
        | "closed"
      kyc_status:
        | "not_submitted"
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
      listing_status:
        | "draft"
        | "pending_verification"
        | "approved"
        | "rejected"
        | "sold"
        | "removed"
      transaction_status:
        | "pending"
        | "escrow_held"
        | "delivered"
        | "completed"
        | "disputed"
        | "refunded"
        | "cancelled"
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
      account_type: ["buyer", "seller", "both"],
      app_role: ["admin", "moderator", "user"],
      dispute_status: [
        "open",
        "under_review",
        "resolved_buyer",
        "resolved_seller",
        "closed",
      ],
      kyc_status: [
        "not_submitted",
        "pending",
        "approved",
        "rejected",
        "expired",
      ],
      listing_status: [
        "draft",
        "pending_verification",
        "approved",
        "rejected",
        "sold",
        "removed",
      ],
      transaction_status: [
        "pending",
        "escrow_held",
        "delivered",
        "completed",
        "disputed",
        "refunded",
        "cancelled",
      ],
    },
  },
} as const
