export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          telegram_user_id: string | null;
          telegram_username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          telegram_user_id?: string | null;
          telegram_username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          telegram_user_id?: string | null;
          telegram_username?: string | null;
          created_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
      };
      expense_categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          icon: string | null;
          color: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          description: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          description?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          description?: string | null;
          date?: string;
          created_at?: string;
        };
      };
      waste_schedules: {
        Row: {
          id: string;
          household_id: string;
          waste_type: string;
          day_of_week: number;
          reminder_time: string;
          deadline_time: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          household_id: string;
          waste_type: string;
          day_of_week: number;
          reminder_time: string;
          deadline_time?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          household_id?: string;
          waste_type?: string;
          day_of_week?: number;
          reminder_time?: string;
          deadline_time?: string | null;
          is_active?: boolean;
        };
      };
      recurring_bills: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          amount: number | null;
          due_day: number;
          reminder_days_before: number;
          category: string | null;
          is_active: boolean;
          last_paid_date: string | null;
          source: "manual" | "gmail";
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          amount?: number | null;
          due_day: number;
          reminder_days_before?: number;
          category?: string | null;
          is_active?: boolean;
          last_paid_date?: string | null;
          source?: "manual" | "gmail";
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          amount?: number | null;
          due_day?: number;
          reminder_days_before?: number;
          category?: string | null;
          is_active?: boolean;
          last_paid_date?: string | null;
          source?: "manual" | "gmail";
        };
      };
      chores: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          frequency: "daily" | "weekly" | "monthly";
          current_assignee: string | null;
          rotation_order: string[];
          last_completed: string | null;
          next_due: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          frequency: "daily" | "weekly" | "monthly";
          current_assignee?: string | null;
          rotation_order?: string[];
          last_completed?: string | null;
          next_due?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          frequency?: "daily" | "weekly" | "monthly";
          current_assignee?: string | null;
          rotation_order?: string[];
          last_completed?: string | null;
          next_due?: string | null;
        };
      };
      telegram_groups: {
        Row: {
          id: string;
          household_id: string;
          chat_id: string;
          chat_title: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          household_id: string;
          chat_id: string;
          chat_title?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          household_id?: string;
          chat_id?: string;
          chat_title?: string | null;
          is_active?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
