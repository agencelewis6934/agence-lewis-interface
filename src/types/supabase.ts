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
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'pm' | 'dev' | 'designer'
          full_name: string | null
          avatar_url: string | null
          onboarded: boolean
          last_seen: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'pm' | 'dev' | 'designer'
          full_name?: string | null
          avatar_url?: string | null
          onboarded?: boolean
          last_seen?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'pm' | 'dev' | 'designer'
          full_name?: string | null
          avatar_url?: string | null
          onboarded?: boolean
          last_seen?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          status: 'prospect' | 'active' | 'paused' | 'lost'
          ltv: number
          pipeline_stage: string | null
          first_contact: string
          last_interaction: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          status?: 'prospect' | 'active' | 'paused' | 'lost'
          ltv?: number
          pipeline_stage?: string | null
          first_contact?: string
          last_interaction?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          status?: 'prospect' | 'active' | 'paused' | 'lost'
          ltv?: number
          pipeline_stage?: string | null
          first_contact?: string
          last_interaction?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          name: string
          status: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled'
          priority: string | null
          start_date: string | null
          end_date: string | null
          budget: number
          budget_used: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled'
          priority?: string | null
          start_date?: string | null
          end_date?: string | null
          budget?: number
          budget_used?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled'
          priority?: string | null
          start_date?: string | null
          end_date?: string | null
          budget?: number
          budget_used?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          project_id: string
          user_id: string
          role: string | null
          joined_at: string
        }
        Insert: {
          project_id: string
          user_id: string
          role?: string | null
          joined_at?: string
        }
        Update: {
          project_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          project_id: string | null
          client_id: string | null
          amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          invoice_date: string | null
          due_date: string | null
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          client_id?: string | null
          amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          invoice_date?: string | null
          due_date?: string | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          client_id?: string | null
          amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          invoice_date?: string | null
          due_date?: string | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          assignee_id: string | null
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'review' | 'done'
          estimated_hours: number | null
          spent_hours: number
          deadline: string | null
          dependencies: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          assignee_id?: string | null
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          estimated_hours?: number | null
          spent_hours?: number
          deadline?: string | null
          dependencies?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          assignee_id?: string | null
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          estimated_hours?: number | null
          spent_hours?: number
          deadline?: string | null
          dependencies?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      timesheets: {
        Row: {
          id: string
          user_id: string
          project_id: string
          task_id: string | null
          hours: number
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          task_id?: string | null
          hours: number
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          task_id?: string | null
          hours?: number
          description?: string | null
          date?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Json | null
          new_data: Json | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      analytics_monthly_revenue: {
        Row: {
          month: string
          total_revenue: number
          recurring_revenue: number
        }
      }
      analytics_overdue_invoices: {
        Row: {
          id: string
          client_id: string
          company_name: string
          amount: number
          due_date: string
          days_overdue: number
          aging_bucket: string
        }
      }
      analytics_client_ltv: {
        Row: {
          id: string
          company_name: string
          status: string
          ltv: number
          total_paid: number
          total_projects: number
        }
      }
      analytics_project_summary: {
        Row: {
          status: string
          project_count: number
          total_budget: number
          total_spent: number
        }
      }
      analytics_task_metrics: {
        Row: {
          status: string
          task_count: number
          avg_age_days: number
          overdue_count: number
        }
      }
      analytics_project_delays: {
        Row: {
          id: string
          name: string
          status: string
          delay_days: number
          delay_percentage: number
        }
      }
      analytics_conversion_funnel: {
        Row: {
          stage: string
          stage_order: number
          count: number
          value: number
          conversion_rate: number
        }
      }
    }
    Functions: {
      calculate_mrr: {
        Args: Record<string, never>
        Returns: number
      }
      get_conversion_rate: {
        Args: Record<string, never>
        Returns: number
      }
      calculate_team_capacity: {
        Args: Record<string, never>
        Returns: {
          user_id: string
          full_name: string
          role: 'admin' | 'pm' | 'dev' | 'designer'
          hours_logged: number
          capacity_pct: number
        }[]
      }
      get_revenue_forecast: {
        Args: {
          forecast_days: number
        }
        Returns: {
          forecast_date: string
          predicted_revenue: number
          confidence_level: string
        }[]
      }
    }
  }
}
