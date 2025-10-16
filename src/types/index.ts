/**
 * Type definitions for Emaily
 */

// User types
export interface User {
  id: string;
  phone_number: string;
  encrypted_phone?: string;
  created_at: Date;
  last_active?: Date;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  preferences?: UserPreferences;
}

export interface UserPreferences {
  timezone?: string;
  summary_length?: 'short' | 'medium' | 'long';
  notification_settings?: Record<string, unknown>;
}

// Email Account types
export interface EmailAccount {
  id: string;
  user_id: string;
  email_address: string;
  provider: 'gmail' | 'outlook' | 'imap';
  encrypted_access_token: string;
  encrypted_refresh_token?: string;
  token_expiry?: Date;
  is_primary: boolean;
  connected_at: Date;
}

// Email types
export interface Email {
  id: string;
  threadId: string;
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  snippet: string;
  isUnread: boolean;
  labels: string[];
}

export interface SendEmailData {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface EmailOperationResult {
  id?: string;
  threadId?: string;
  success: boolean;
  error?: string;
}

// AI Intent types
export type IntentType =
  | 'READ_EMAIL'
  | 'SEND_EMAIL'
  | 'REPLY_EMAIL'
  | 'SEARCH_EMAIL'
  | 'DELETE_EMAIL'
  | 'ARCHIVE_EMAIL'
  | 'LOOKUP_CONTACT'
  | 'HELP'
  | 'CONFIRM'
  | 'CANCEL'
  | 'OTHER';

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: {
    email_address?: string;
    person_name?: string;
    subject?: string;
    content?: string;
    search_query?: string;
    company?: string;
    time_range?: string;
    [key: string]: string | undefined;
  };
  needs_context?: boolean;
  error?: string;
}

// Context types
export interface ConversationContext {
  current_email: Email | null;
  last_search: string | null;
  pending_action: PendingAction | null;
  email_list: Email[];
}

export interface PendingAction {
  type: 'SEND_EMAIL' | 'REPLY_EMAIL' | 'DELETE_EMAIL' | 'ARCHIVE_EMAIL';
  data: {
    to?: string;
    subject?: string;
    body?: string;
    threadId?: string;
    messageId?: string;
    [key: string]: string | undefined;
  };
}

// Session types
export interface Session {
  id: string;
  user_id: string;
  phone_number: string;
  context: ConversationContext;
  messages: Message[];
  started_at: Date;
  expires_at: Date;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Gmail API types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: { data?: string };
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
      parts?: any[];
    }>;
  };
}

