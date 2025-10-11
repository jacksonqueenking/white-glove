// Database types generated from Supabase schema
// This is a simplified version - you can generate full types using `supabase gen types typescript`

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
      clients: {
        Row: {
          client_id: string
          name: string
          email: string
          phone: string
          credit_card_stripe_id: string | null
          billing_address: Json | null
          preferences: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          client_id: string
          name: string
          email: string
          phone: string
          credit_card_stripe_id?: string | null
          billing_address?: Json | null
          preferences?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          client_id?: string
          name?: string
          email?: string
          phone?: string
          credit_card_stripe_id?: string | null
          billing_address?: Json | null
          preferences?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      venues: {
        Row: {
          venue_id: string
          name: string
          description: string | null
          address: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          venue_id: string
          name: string
          description?: string | null
          address: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          venue_id?: string
          name?: string
          description?: string | null
          address?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      vendors: {
        Row: {
          vendor_id: string
          name: string
          email: string
          phone_number: string
          address: Json
          description: string | null
          contact_persons: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          vendor_id: string
          name: string
          email: string
          phone_number: string
          address: Json
          description?: string | null
          contact_persons?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          vendor_id?: string
          name?: string
          email?: string
          phone_number?: string
          address?: Json
          description?: string | null
          contact_persons?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      invitations: {
        Row: {
          invitation_id: string
          token: string
          invitee_email: string
          invited_by: string
          invitation_type: 'venue' | 'vendor' | 'client'
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at: string
          used_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          invitation_id?: string
          token: string
          invitee_email: string
          invited_by: string
          invitation_type: 'venue' | 'vendor' | 'client'
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at: string
          used_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          invitation_id?: string
          token?: string
          invitee_email?: string
          invited_by?: string
          invitation_type?: 'venue' | 'vendor' | 'client'
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at?: string
          used_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      venue_vendors: {
        Row: {
          venue_vendor_id: string
          venue_id: string
          vendor_id: string
          approval_status: 'pending' | 'approved' | 'rejected' | 'n/a'
          cois: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          venue_vendor_id?: string
          venue_id: string
          vendor_id: string
          approval_status?: 'pending' | 'approved' | 'rejected' | 'n/a'
          cois?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          venue_vendor_id?: string
          venue_id?: string
          vendor_id?: string
          approval_status?: 'pending' | 'approved' | 'rejected' | 'n/a'
          cois?: Json
          created_at?: string
          updated_at?: string
        }
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
    }
    Enums: {
      [_ in never]: never
    }
  }
}
