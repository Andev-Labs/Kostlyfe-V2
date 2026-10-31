export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          expense_date: string
          id: string
          notes: string | null
          owner_id: string
          property_id: string | null
          receipt_path: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          expense_date: string
          id?: string
          notes?: string | null
          owner_id?: string
          property_id?: string | null
          receipt_path?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          expense_date?: string
          id?: string
          notes?: string | null
          owner_id?: string
          property_id?: string | null
          receipt_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_adjustments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          owner_id: string
          reason: string
          renovation_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          owner_id: string
          reason: string
          renovation_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          owner_id?: string
          reason?: string
          renovation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_adjustments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_adjustments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_adjustments_renovation_id_fkey"
            columns: ["renovation_id"]
            isOneToOne: false
            referencedRelation: "renovations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          base_amount: number
          created_at: string
          due_date: string
          extended_due_date: string | null
          extension_note: string | null
          id: string
          lease_id: string
          owner_id: string
          period_month: string
        }
        Insert: {
          base_amount: number
          created_at?: string
          due_date: string
          extended_due_date?: string | null
          extension_note?: string | null
          id?: string
          lease_id: string
          owner_id: string
          period_month: string
        }
        Update: {
          base_amount?: number
          created_at?: string
          due_date?: string
          extended_due_date?: string | null
          extension_note?: string | null
          id?: string
          lease_id?: string
          owner_id?: string
          period_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          deposit: number
          due_day: number
          end_date: string | null
          id: string
          monthly_rent: number
          notes: string | null
          owner_id: string
          property_id: string
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deposit?: number
          due_day?: number
          end_date?: string | null
          id?: string
          monthly_rent: number
          notes?: string | null
          owner_id?: string
          property_id: string
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          deposit?: number
          due_day?: number
          end_date?: string | null
          id?: string
          monthly_rent?: number
          notes?: string | null
          owner_id?: string
          property_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          owner_id: string
          payment_id: string
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          owner_id: string
          payment_id: string
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          owner_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          lease_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          owner_id: string
          paid_at: string
          proof_path: string | null
          receipt_no: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lease_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id: string
          paid_at: string
          proof_path?: string | null
          receipt_no: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lease_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          paid_at?: string
          proof_path?: string | null
          receipt_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bank_account: string | null
          bank_holder: string | null
          bank_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          receipt_prefix: string
          wa_template: string
        }
        Insert: {
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          receipt_prefix?: string
          wa_template?: string
        }
        Update: {
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          receipt_prefix?: string
          wa_template?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          default_rent: number
          id: string
          name: string
          notes: string | null
          owner_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          default_rent?: number
          id?: string
          name: string
          notes?: string | null
          owner_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          default_rent?: number
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
        }
        Relationships: []
      }
      renovations: {
        Row: {
          cost: number
          created_at: string
          description: string | null
          id: string
          installments: number
          lease_id: string | null
          owner_id: string
          property_id: string
          renovation_date: string
          start_month: string
          title: string
        }
        Insert: {
          cost: number
          created_at?: string
          description?: string | null
          id?: string
          installments?: number
          lease_id?: string | null
          owner_id?: string
          property_id: string
          renovation_date: string
          start_month: string
          title: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          installments?: number
          lease_id?: string | null
          owner_id?: string
          property_id?: string
          renovation_date?: string
          start_month?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "renovations_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovations_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          emergency_contact: string | null
          id: string
          name: string
          nik: string | null
          notes: string | null
          owner_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          emergency_contact?: string | null
          id?: string
          name: string
          nik?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          emergency_contact?: string | null
          id?: string
          name?: string
          nik?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      invoice_balances: {
        Row: {
          amount_due: number | null
          balance: number | null
          base_amount: number | null
          discount: number | null
          due_date: string | null
          effective_due_date: string | null
          extended_due_date: string | null
          extension_note: string | null
          id: string | null
          lease_id: string | null
          owner_id: string | null
          paid: number | null
          period_month: string | null
          property_id: string | null
          property_name: string | null
          status: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_phone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_summaries: {
        Row: {
          created_at: string | null
          credit: number | null
          deposit: number | null
          due_day: number | null
          end_date: string | null
          first_unpaid_month: string | null
          id: string | null
          last_invoice_month: string | null
          monthly_rent: number | null
          notes: string | null
          outstanding: number | null
          overdue_count: number | null
          owner_id: string | null
          property_id: string | null
          property_name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_phone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      app_today: { Args: never; Returns: string }
      apply_renovation: {
        Args: { p_renovation_id: string }
        Returns: undefined
      }
      delete_payment: { Args: { p_payment_id: string }; Returns: undefined }
      delete_renovation: {
        Args: { p_renovation_id: string }
        Returns: undefined
      }
      ensure_all_invoices: { Args: never; Returns: number }
      ensure_invoices: {
        Args: { p_lease_id: string; p_until?: string }
        Returns: number
      }
      reallocate_lease: { Args: { p_lease_id: string }; Returns: undefined }
      record_payment: {
        Args: {
          p_amount?: number
          p_lease_id: string
          p_method?: Database["public"]["Enums"]["payment_method"]
          p_months?: number
          p_notes?: string
          p_paid_at?: string
          p_proof_path?: string
        }
        Returns: string
      }
    }
    Enums: {
      expense_category:
        | "listrik"
        | "air"
        | "pajak"
        | "perbaikan"
        | "kebersihan"
        | "lainnya"
      lease_status: "active" | "ended"
      payment_method: "cash" | "transfer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      expense_category: [
        "listrik",
        "air",
        "pajak",
        "perbaikan",
        "kebersihan",
        "lainnya",
      ],
      lease_status: ["active", "ended"],
      payment_method: ["cash", "transfer"],
    },
  },
} as const

