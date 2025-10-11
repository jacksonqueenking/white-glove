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
      action_history: {
        Row: {
          action_id: string
          action_type: string
          created_at: string
          description: string
          event_id: string | null
          metadata: Json | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          action_id?: string
          action_type: string
          created_at?: string
          description: string
          event_id?: string | null
          metadata?: Json | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          action_id?: string
          action_type?: string
          created_at?: string
          description?: string
          event_id?: string | null
          metadata?: Json | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      chats: {
        Row: {
          archived: boolean | null
          chat_id: string
          created_at: string
          event_id: string | null
          messages: Json
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          archived?: boolean | null
          chat_id?: string
          created_at?: string
          event_id?: string | null
          messages?: Json
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          archived?: boolean | null
          chat_id?: string
          created_at?: string
          event_id?: string | null
          messages?: Json
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_address: Json | null
          client_id: string
          created_at: string
          credit_card_stripe_id: string | null
          deleted_at: string | null
          email: string
          name: string
          phone: string
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          client_id: string
          created_at?: string
          credit_card_stripe_id?: string | null
          deleted_at?: string | null
          email: string
          name: string
          phone: string
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          client_id?: string
          created_at?: string
          credit_card_stripe_id?: string | null
          deleted_at?: string | null
          email?: string
          name?: string
          phone?: string
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          contract_id: string
          created_at: string
          currency: string
          event_id: string
          payment_schedule: Json
          status: string
          stripe_payment_intent_ids: Json | null
          total_amount: number
          updated_at: string
          version: number
        }
        Insert: {
          contract_id?: string
          created_at?: string
          currency?: string
          event_id: string
          payment_schedule?: Json
          status?: string
          stripe_payment_intent_ids?: Json | null
          total_amount: number
          updated_at?: string
          version?: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          currency?: string
          event_id?: string
          payment_schedule?: Json
          status?: string
          stripe_payment_intent_ids?: Json | null
          total_amount?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      elements: {
        Row: {
          availability_rules: Json | null
          category: string | null
          contract: Json | null
          created_at: string
          deleted_at: string | null
          description: string | null
          element_id: string
          files: Json | null
          image_url: string | null
          name: string
          price: number
          updated_at: string
          venue_vendor_id: string
        }
        Insert: {
          availability_rules?: Json | null
          category?: string | null
          contract?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          element_id?: string
          files?: Json | null
          image_url?: string | null
          name: string
          price?: number
          updated_at?: string
          venue_vendor_id: string
        }
        Update: {
          availability_rules?: Json | null
          category?: string | null
          contract?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          element_id?: string
          files?: Json | null
          image_url?: string | null
          name?: string
          price?: number
          updated_at?: string
          venue_vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elements_venue_vendor_id_fkey"
            columns: ["venue_vendor_id"]
            isOneToOne: false
            referencedRelation: "venue_vendors"
            referencedColumns: ["venue_vendor_id"]
          },
        ]
      }
      event_elements: {
        Row: {
          amount: number
          contract_completed: boolean | null
          created_at: string
          customization: string | null
          element_id: string
          event_element_id: string
          event_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_completed?: boolean | null
          created_at?: string
          customization?: string | null
          element_id: string
          event_element_id?: string
          event_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_completed?: boolean | null
          created_at?: string
          customization?: string | null
          element_id?: string
          event_element_id?: string
          event_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_elements_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "elements"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "event_elements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_spaces: {
        Row: {
          created_at: string
          event_id: string
          space_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          space_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_spaces_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_spaces_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["space_id"]
          },
        ]
      }
      events: {
        Row: {
          calendar: Json | null
          client_id: string | null
          created_at: string
          date: string
          deleted_at: string | null
          description: string | null
          event_id: string
          name: string
          rsvp_deadline: string | null
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          calendar?: Json | null
          client_id?: string | null
          created_at?: string
          date: string
          deleted_at?: string | null
          description?: string | null
          event_id?: string
          name: string
          rsvp_deadline?: string | null
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          calendar?: Json | null
          client_id?: string | null
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          event_id?: string
          name?: string
          rsvp_deadline?: string | null
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          file_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          related_to_id: string | null
          related_to_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_id?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          related_to_id?: string | null
          related_to_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          related_to_id?: string | null
          related_to_type?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string
          dietary_restrictions: string | null
          email: string | null
          event_id: string
          guest_id: string
          name: string
          notes: string | null
          phone: string | null
          plus_one: boolean | null
          rsvp_status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          event_id: string
          guest_id?: string
          name: string
          notes?: string | null
          phone?: string | null
          plus_one?: boolean | null
          rsvp_status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          event_id?: string
          guest_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          plus_one?: boolean | null
          rsvp_status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          expires_at: string
          invitation_id: string
          invitation_type: string
          invited_by: string
          invitee_email: string
          metadata: Json | null
          status: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          invitation_id?: string
          invitation_type: string
          invited_by: string
          invitee_email: string
          metadata?: Json | null
          status?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          invitation_id?: string
          invitation_type?: string
          invited_by?: string
          invitee_email?: string
          metadata?: Json | null
          status?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          action_required: boolean | null
          attachments: Json | null
          content: string
          created_at: string
          event_id: string | null
          message_id: string
          read: boolean | null
          recipient_id: string
          recipient_type: string
          sender_id: string
          sender_type: string
          suggested_response: string | null
          thread_id: string
        }
        Insert: {
          action_required?: boolean | null
          attachments?: Json | null
          content: string
          created_at?: string
          event_id?: string | null
          message_id?: string
          read?: boolean | null
          recipient_id: string
          recipient_type: string
          sender_id: string
          sender_type: string
          suggested_response?: string | null
          thread_id: string
        }
        Update: {
          action_required?: boolean | null
          attachments?: Json | null
          content?: string
          created_at?: string
          event_id?: string | null
          message_id?: string
          read?: boolean | null
          recipient_id?: string
          recipient_type?: string
          sender_id?: string
          sender_type?: string
          suggested_response?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          content: string
          created_at: string
          notification_id: string
          notification_type: string
          read: boolean | null
          title: string
          user_id: string
          user_type: string
        }
        Insert: {
          action_url?: string | null
          content: string
          created_at?: string
          notification_id?: string
          notification_type: string
          read?: boolean | null
          title: string
          user_id: string
          user_type: string
        }
        Update: {
          action_url?: string | null
          content?: string
          created_at?: string
          notification_id?: string
          notification_type?: string
          read?: boolean | null
          title?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          capacity: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          floorplan_url: string | null
          main_image_url: string | null
          name: string
          photos: Json | null
          space_id: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          floorplan_url?: string | null
          main_image_url?: string | null
          name: string
          photos?: Json | null
          space_id?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          floorplan_url?: string | null
          main_image_url?: string | null
          name?: string
          photos?: Json | null
          space_id?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to_id: string
          assigned_to_type: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          event_id: string
          form_response: Json | null
          form_schema: Json | null
          name: string
          priority: string
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          assigned_to_id: string
          assigned_to_type: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description: string
          due_date?: string | null
          event_id: string
          form_response?: Json | null
          form_schema?: Json | null
          name: string
          priority?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Update: {
          assigned_to_id?: string
          assigned_to_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          event_id?: string
          form_response?: Json | null
          form_schema?: Json | null
          name?: string
          priority?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: Json
          contact_persons: Json | null
          created_at: string
          deleted_at: string | null
          description: string | null
          email: string
          name: string
          phone_number: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          address: Json
          contact_persons?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email: string
          name: string
          phone_number: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          address?: Json
          contact_persons?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string
          name?: string
          phone_number?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      venue_vendors: {
        Row: {
          approval_status: string
          cois: Json | null
          created_at: string
          updated_at: string
          vendor_id: string
          venue_id: string
          venue_vendor_id: string
        }
        Insert: {
          approval_status?: string
          cois?: Json | null
          created_at?: string
          updated_at?: string
          vendor_id: string
          venue_id: string
          venue_vendor_id?: string
        }
        Update: {
          approval_status?: string
          cois?: Json | null
          created_at?: string
          updated_at?: string
          vendor_id?: string
          venue_id?: string
          venue_vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "venue_vendors_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      venues: {
        Row: {
          address: Json
          created_at: string
          deleted_at: string | null
          description: string | null
          name: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          address: Json
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          name: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          address?: Json
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          name?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_client: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_vendor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_venue: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

