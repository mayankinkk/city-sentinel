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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_token: string
          invited_by: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      issue_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin_update: boolean
          issue_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin_update?: boolean
          issue_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin_update?: boolean
          issue_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_follows: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_follows_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_follows_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_type: string
          image_url: string
          issue_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_type?: string
          image_url: string
          issue_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          issue_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_images_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_images_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_status_history: {
        Row: {
          changed_by: string | null
          changed_by_name: string | null
          changed_by_role: string | null
          created_at: string
          id: string
          issue_id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          issue_id: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          issue_id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_status_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_status_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_upvotes: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_upvotes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_upvotes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          address: string | null
          assigned_to: string | null
          created_at: string
          department_id: string | null
          description: string
          id: string
          image_url: string | null
          issue_type: Database["public"]["Enums"]["issue_type"]
          latitude: number
          longitude: number
          priority: Database["public"]["Enums"]["issue_priority"]
          reporter_email: string | null
          reporter_id: string | null
          resolved_at: string | null
          resolved_image_url: string | null
          status: Database["public"]["Enums"]["issue_status"]
          terms_accepted: boolean | null
          title: string
          updated_at: string
          verification_notes: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string
          department_id?: string | null
          description: string
          id?: string
          image_url?: string | null
          issue_type?: Database["public"]["Enums"]["issue_type"]
          latitude: number
          longitude: number
          priority?: Database["public"]["Enums"]["issue_priority"]
          reporter_email?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_image_url?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          terms_accepted?: boolean | null
          title: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          image_url?: string | null
          issue_type?: Database["public"]["Enums"]["issue_type"]
          latitude?: number
          longitude?: number
          priority?: Database["public"]["Enums"]["issue_priority"]
          reporter_email?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_image_url?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          terms_accepted?: boolean | null
          title?: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          issue_id: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          issue_id?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          issue_id?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_log: {
        Row: {
          access_context: string | null
          accessed_at: string
          admin_id: string
          id: string
          profile_viewed: string
        }
        Insert: {
          access_context?: string | null
          accessed_at?: string
          admin_id: string
          id?: string
          profile_viewed: string
        }
        Update: {
          access_context?: string | null
          accessed_at?: string
          admin_id?: string
          id?: string
          profile_viewed?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          notification_email: boolean
          notification_push: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          notification_email?: boolean
          notification_push?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          notification_email?: boolean
          notification_push?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_departments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_history: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_by: string
          verifier_name: string | null
          verifier_role: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          verification_notes?: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_by: string
          verifier_name?: string | null
          verifier_role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_by?: string
          verifier_name?: string | null
          verifier_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      issues_public: {
        Row: {
          address: string | null
          assigned_to: string | null
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string | null
          image_url: string | null
          issue_type: Database["public"]["Enums"]["issue_type"] | null
          latitude: number | null
          longitude: number | null
          priority: Database["public"]["Enums"]["issue_priority"] | null
          reporter_id: string | null
          resolved_at: string | null
          resolved_image_url: string | null
          status: Database["public"]["Enums"]["issue_status"] | null
          terms_accepted: boolean | null
          title: string | null
          updated_at: string | null
          verification_notes: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          latitude?: number | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["issue_priority"] | null
          reporter_id?: never
          resolved_at?: string | null
          resolved_image_url?: string | null
          status?: Database["public"]["Enums"]["issue_status"] | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          latitude?: number | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["issue_priority"] | null
          reporter_id?: never
          resolved_at?: string | null
          resolved_image_url?: string | null
          status?: Database["public"]["Enums"]["issue_status"] | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      consume_admin_invite: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      find_nearby_issues: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_radius_km?: number
          p_title: string
        }
        Returns: {
          address: string
          created_at: string
          distance_km: number
          id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          latitude: number
          longitude: number
          status: Database["public"]["Enums"]["issue_status"]
          title: string
        }[]
      }
      generate_admin_invite: {
        Args: { p_email: string; p_invited_by: string }
        Returns: {
          invite_id: string
          invite_token: string
        }[]
      }
      get_public_issues: {
        Args: never
        Returns: {
          address: string
          assigned_to: string
          created_at: string
          department_id: string
          description: string
          id: string
          image_url: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          latitude: number
          longitude: number
          priority: Database["public"]["Enums"]["issue_priority"]
          resolved_at: string
          resolved_image_url: string
          status: Database["public"]["Enums"]["issue_status"]
          terms_accepted: boolean
          title: string
          updated_at: string
          verification_notes: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string
          verified_by: string
        }[]
      }
      get_user_department_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_notification: {
        Args: {
          p_issue_id: string
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      log_profile_access: {
        Args: { p_context?: string; p_profile_id: string }
        Returns: undefined
      }
      user_has_department: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "department_admin"
        | "field_worker"
        | "moderator"
      issue_priority: "low" | "medium" | "high"
      issue_status: "pending" | "in_progress" | "resolved" | "withdrawn"
      issue_type:
        | "pothole"
        | "streetlight"
        | "drainage"
        | "garbage"
        | "graffiti"
        | "sidewalk"
        | "traffic_sign"
        | "water_leak"
        | "other"
      verification_status:
        | "pending_verification"
        | "verified"
        | "invalid"
        | "spam"
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
      app_role: [
        "admin",
        "user",
        "super_admin",
        "department_admin",
        "field_worker",
        "moderator",
      ],
      issue_priority: ["low", "medium", "high"],
      issue_status: ["pending", "in_progress", "resolved", "withdrawn"],
      issue_type: [
        "pothole",
        "streetlight",
        "drainage",
        "garbage",
        "graffiti",
        "sidewalk",
        "traffic_sign",
        "water_leak",
        "other",
      ],
      verification_status: [
        "pending_verification",
        "verified",
        "invalid",
        "spam",
      ],
    },
  },
} as const
