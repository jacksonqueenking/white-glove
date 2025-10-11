// Authentication types

export interface UserMetadata {
  user_type: 'client' | 'venue' | 'vendor' | 'admin';
  entity_id: string; // ID in respective table (client_id, venue_id, vendor_id)
  name: string;
  onboarding_completed: boolean;
  preferences?: {
    notification_email: boolean;
    notification_sms: boolean;
    two_factor_enabled?: boolean;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
  created_at: string;
  last_sign_in_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthResponse<T = AuthSession> {
  data: T | null;
  error: AuthError | null;
}
