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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      automation_rules: {
        Row: {
          action_type: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      briefs: {
        Row: {
          admin_notes: string | null
          area: string | null
          business: string
          contact_name: string
          created_at: string
          email: string
          existing_site: string | null
          goals: string | null
          hours: string | null
          id: string
          notes: string | null
          package_key: string | null
          package_name: string | null
          phone: string
          services: string | null
          status: string
          trade: string | null
        }
        Insert: {
          admin_notes?: string | null
          area?: string | null
          business: string
          contact_name: string
          created_at?: string
          email: string
          existing_site?: string | null
          goals?: string | null
          hours?: string | null
          id?: string
          notes?: string | null
          package_key?: string | null
          package_name?: string | null
          phone: string
          services?: string | null
          status?: string
          trade?: string | null
        }
        Update: {
          admin_notes?: string | null
          area?: string | null
          business?: string
          contact_name?: string
          created_at?: string
          email?: string
          existing_site?: string | null
          goals?: string | null
          hours?: string | null
          id?: string
          notes?: string | null
          package_key?: string | null
          package_name?: string | null
          phone?: string
          services?: string | null
          status?: string
          trade?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string
          currency: string
          emoji: string
          external_account_id: string | null
          id: string
          is_active: boolean
          name: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          emoji?: string
          external_account_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          emoji?: string
          external_account_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          key: string
          label: string
          multiline: boolean
          section: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          label: string
          multiline?: boolean
          section: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          label?: string
          multiline?: boolean
          section?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          created_at: string
          followers: number
          id: string
          metadata: Json
          metric_date: string
          revenue: number
          sales: number
          source_id: string
          source_kind: string
          updated_at: string
          user_id: string
          views: number
        }
        Insert: {
          created_at?: string
          followers?: number
          id?: string
          metadata?: Json
          metric_date: string
          revenue?: number
          sales?: number
          source_id?: string
          source_kind: string
          updated_at?: string
          user_id: string
          views?: number
        }
        Update: {
          created_at?: string
          followers?: number
          id?: string
          metadata?: Json
          metric_date?: string
          revenue?: number
          sales?: number
          source_id?: string
          source_kind?: string
          updated_at?: string
          user_id?: string
          views?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          auto_source: string | null
          created_at: string
          current_value: number
          due_date: string | null
          id: string
          name: string
          status: string
          target_value: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_source?: string | null
          created_at?: string
          current_value?: number
          due_date?: string | null
          id?: string
          name: string
          status?: string
          target_value: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_source?: string | null
          created_at?: string
          current_value?: number
          due_date?: string | null
          id?: string
          name?: string
          status?: string
          target_value?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          account_reference: string | null
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          label: string
          last_error: string | null
          last_synced_at: string | null
          next_sync_at: string | null
          provider: string
          status: string
          sync_frequency_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_reference?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          label: string
          last_error?: string | null
          last_synced_at?: string | null
          next_sync_at?: string | null
          provider: string
          status?: string
          sync_frequency_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_reference?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          label?: string
          last_error?: string | null
          last_synced_at?: string | null
          next_sync_at?: string | null
          provider?: string
          status?: string
          sync_frequency_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          brief_id: string | null
          business_name: string | null
          client_email: string | null
          client_name: string | null
          currency: string
          id: string
          paid_at: string
          payment_intent_id: string | null
          product_key: string | null
          product_name: string | null
          stage: string | null
          stripe_session_id: string
        }
        Insert: {
          amount: number
          brief_id?: string | null
          business_name?: string | null
          client_email?: string | null
          client_name?: string | null
          currency?: string
          id?: string
          paid_at?: string
          payment_intent_id?: string | null
          product_key?: string | null
          product_name?: string | null
          stage?: string | null
          stripe_session_id: string
        }
        Update: {
          amount?: number
          brief_id?: string | null
          business_name?: string | null
          client_email?: string | null
          client_name?: string | null
          currency?: string
          id?: string
          paid_at?: string
          payment_intent_id?: string | null
          product_key?: string | null
          product_name?: string | null
          stage?: string | null
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing: {
        Row: {
          active: boolean
          balance: number
          blurb: string | null
          deposit: number
          features: Json
          flag: string | null
          key: string
          monthly: number
          name: string
          not_included: Json
          price_note: string | null
          ref: string | null
          setup: number
          sort_order: number
          split_note: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          balance: number
          blurb?: string | null
          deposit: number
          features?: Json
          flag?: string | null
          key: string
          monthly?: number
          name: string
          not_included?: Json
          price_note?: string | null
          ref?: string | null
          setup: number
          sort_order?: number
          split_note?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          balance?: number
          blurb?: string | null
          deposit?: number
          features?: Json
          flag?: string | null
          key?: string
          monthly?: number
          name?: string
          not_included?: Json
          price_note?: string | null
          ref?: string | null
          setup?: number
          sort_order?: number
          split_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      processed_events: {
        Row: {
          id: string
          received_at: string
          type: string | null
        }
        Insert: {
          id: string
          received_at?: string
          type?: string | null
        }
        Update: {
          id?: string
          received_at?: string
          type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_enabled: boolean
          base_currency: string
          created_at: string
          display_name: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          access_enabled?: boolean
          base_currency?: string
          created_at?: string
          display_name?: string
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          access_enabled?: boolean
          base_currency?: string
          created_at?: string
          display_name?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      socials: {
        Row: {
          created_at: string
          engagement_rate: number
          followers: number
          growth: number
          handle: string
          id: string
          last_synced_at: string | null
          platform: string
          profile_url: string | null
          source: string
          updated_at: string
          user_id: string
          views: number
        }
        Insert: {
          created_at?: string
          engagement_rate?: number
          followers?: number
          growth?: number
          handle?: string
          id?: string
          last_synced_at?: string | null
          platform: string
          profile_url?: string | null
          source?: string
          updated_at?: string
          user_id: string
          views?: number
        }
        Update: {
          created_at?: string
          engagement_rate?: number
          followers?: number
          growth?: number
          handle?: string
          id?: string
          last_synced_at?: string | null
          platform?: string
          profile_url?: string | null
          source?: string
          updated_at?: string
          user_id?: string
          views?: number
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          integration_id: string | null
          provider: string
          started_at: string
          status: string
          summary: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          provider: string
          started_at?: string
          status?: string
          summary?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          provider?: string
          started_at?: string
          status?: string
          summary?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          details: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          business_id: string | null
          created_at: string
          currency: string
          description: string
          external_id: string | null
          fee_amount: number
          gross_amount: number
          id: string
          metadata: Json
          net_amount: number
          occurred_at: string
          provider: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          external_id?: string | null
          fee_amount?: number
          gross_amount?: number
          id?: string
          metadata?: Json
          net_amount?: number
          occurred_at: string
          provider: string
          transaction_type?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          external_id?: string | null
          fee_amount?: number
          gross_amount?: number
          id?: string
          metadata?: Json
          net_amount?: number
          occurred_at?: string
          provider?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const

