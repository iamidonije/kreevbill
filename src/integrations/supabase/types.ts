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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          amount: number
          billing_cycle: string
          category: string
          created_at: string
          currency: string
          id: string
          is_demo: boolean
          is_usd_billed: boolean
          is_variable: boolean
          last_paid_at: string | null
          last_reviewed_at: string | null
          name: string
          next_due_date: string | null
          notes: string | null
          payment_method_note: string | null
          status: string
          topup_every_days: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          category?: string
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          is_usd_billed?: boolean
          is_variable?: boolean
          last_paid_at?: string | null
          last_reviewed_at?: string | null
          name: string
          next_due_date?: string | null
          notes?: string | null
          payment_method_note?: string | null
          status?: string
          topup_every_days?: number | null
          type?: string
          user_id?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          category?: string
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          is_usd_billed?: boolean
          is_variable?: boolean
          last_paid_at?: string | null
          last_reviewed_at?: string | null
          name?: string
          next_due_date?: string | null
          notes?: string | null
          payment_method_note?: string | null
          status?: string
          topup_every_days?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          item_id: string | null
          message: string
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          item_id?: string | null
          message: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          item_id?: string | null
          message?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_at: string
          id: string
          item_id: string
          new_amount: number
          old_amount: number
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          item_id: string
          new_amount: number
          old_amount: number
          user_id?: string
        }
        Update: {
          changed_at?: string
          id?: string
          item_id?: string
          new_amount?: number
          old_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          currency: string
          full_name: string | null
          fx_rates: Json
          id: string
          notification_prefs: Json
          onboarded: boolean
          plan: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          fx_rates?: Json
          id: string
          notification_prefs?: Json
          onboarded?: boolean
          plan?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          fx_rates?: Json
          id?: string
          notification_prefs?: Json
          onboarded?: boolean
          plan?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          month: string
          summary: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          summary?: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      savings_actions: {
        Row: {
          action_type: string
          confirmed: boolean
          created_at: string
          estimated_monthly_saving: number
          id: string
          is_demo: boolean
          item_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          confirmed?: boolean
          created_at?: string
          estimated_monthly_saving?: number
          id?: string
          is_demo?: boolean
          item_id?: string | null
          user_id?: string
        }
        Update: {
          action_type?: string
          confirmed?: boolean
          created_at?: string
          estimated_monthly_saving?: number
          id?: string
          is_demo?: boolean
          item_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_actions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          id: string
          saved_amount: number
          target_amount: number
          target_date: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          saved_amount?: number
          target_amount?: number
          target_date?: string | null
          title: string
          type?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          saved_amount?: number
          target_amount?: number
          target_date?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
