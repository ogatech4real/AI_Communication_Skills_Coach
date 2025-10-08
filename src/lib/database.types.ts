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
      app_user: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
        }
      }
      scenario: {
        Row: {
          id: string
          title: string
          description: string
          objective: string
          rubric: Json
          ai_persona: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          objective: string
          rubric?: Json
          ai_persona: string
          icon?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          objective?: string
          rubric?: Json
          ai_persona?: string
          icon?: string
          created_at?: string
        }
      }
      scenario_doc: {
        Row: {
          id: number
          scenario_id: string | null
          content: string
          embedding: number[] | null
          metadata: Json
        }
        Insert: {
          id?: number
          scenario_id?: string | null
          content: string
          embedding?: number[] | null
          metadata?: Json
        }
        Update: {
          id?: number
          scenario_id?: string | null
          content?: string
          embedding?: number[] | null
          metadata?: Json
        }
      }
      session: {
        Row: {
          id: string
          user_id: string | null
          scenario_id: string | null
          started_at: string
          ended_at: string | null
          status: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          scenario_id?: string | null
          started_at?: string
          ended_at?: string | null
          status?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          scenario_id?: string | null
          started_at?: string
          ended_at?: string | null
          status?: string
        }
      }
      message: {
        Row: {
          id: number
          session_id: string | null
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          session_id?: string | null
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          session_id?: string | null
          role?: string
          content?: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: number
          session_id: string | null
          summary: string
          scores: Json
          recommendations: string
          created_at: string
        }
        Insert: {
          id?: number
          session_id?: string | null
          summary: string
          scores: Json
          recommendations: string
          created_at?: string
        }
        Update: {
          id?: number
          session_id?: string | null
          summary?: string
          scores?: Json
          recommendations?: string
          created_at?: string
        }
      }
    }
  }
}
