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
      action_items: {
        Row: {
          created_at: string | null
          department_id: string | null
          dimension_ids: string[]
          id: string
          is_public: boolean
          owner_id: string | null
          priority: Database["public"]["Enums"]["action_priority_enum"]
          problem_statement: string | null
          status: Database["public"]["Enums"]["action_status_enum"]
          success_criteria: string | null
          survey_id: string | null
          target_date: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          dimension_ids?: string[]
          id?: string
          is_public?: boolean
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["action_priority_enum"]
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["action_status_enum"]
          success_criteria?: string | null
          survey_id?: string | null
          target_date?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          dimension_ids?: string[]
          id?: string
          is_public?: boolean
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["action_priority_enum"]
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["action_status_enum"]
          success_criteria?: string | null
          survey_id?: string | null
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      action_updates: {
        Row: {
          action_item_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
        }
        Insert: {
          action_item_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
        }
        Update: {
          action_item_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_updates_action_item_id_fkey"
            columns: ["action_item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_updates_action_item_id_fkey"
            columns: ["action_item_id"]
            isOneToOne: false
            referencedRelation: "v_public_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          id: string
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      derived_metrics: {
        Row: {
          avg_score: number | null
          computed_at: string | null
          created_at: string | null
          dimension_id: string | null
          favorable_pct: number | null
          id: string
          neutral_pct: number | null
          respondent_count: number
          segment_type: string | null
          segment_value: string | null
          survey_id: string
          unfavorable_pct: number | null
        }
        Insert: {
          avg_score?: number | null
          computed_at?: string | null
          created_at?: string | null
          dimension_id?: string | null
          favorable_pct?: number | null
          id?: string
          neutral_pct?: number | null
          respondent_count?: number
          segment_type?: string | null
          segment_value?: string | null
          survey_id: string
          unfavorable_pct?: number | null
        }
        Update: {
          avg_score?: number | null
          computed_at?: string | null
          created_at?: string | null
          dimension_id?: string | null
          favorable_pct?: number | null
          id?: string
          neutral_pct?: number | null
          respondent_count?: number
          segment_type?: string | null
          segment_value?: string | null
          survey_id?: string
          unfavorable_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "derived_metrics_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "derived_metrics_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "v_dimension_scores"
            referencedColumns: ["dimension_id"]
          },
          {
            foreignKeyName: "derived_metrics_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      dimensions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      participation_tokens: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          role_id: string | null
          submitted_at: string
          survey_id: string
          tenure_band: Database["public"]["Enums"]["tenure_band_enum"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          role_id?: string | null
          submitted_at?: string
          survey_id: string
          tenure_band?: Database["public"]["Enums"]["tenure_band_enum"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          role_id?: string | null
          submitted_at?: string
          survey_id?: string
          tenure_band?: Database["public"]["Enums"]["tenure_band_enum"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participation_tokens_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_tokens_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_tokens_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department_id: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          role_id: string | null
          team_id: string | null
          tenure_band: Database["public"]["Enums"]["tenure_band_enum"] | null
          work_type: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role_id?: string | null
          team_id?: string | null
          tenure_band?: Database["public"]["Enums"]["tenure_band_enum"] | null
          work_type?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role_id?: string | null
          team_id?: string | null
          tenure_band?: Database["public"]["Enums"]["tenure_band_enum"] | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_snapshots: {
        Row: {
          created_at: string | null
          id: string
          published_at: string | null
          published_by: string | null
          snapshot_data: Json
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          published_at?: string | null
          published_by?: string | null
          snapshot_data?: Json
          survey_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          published_at?: string | null
          published_by?: string | null
          snapshot_data?: Json
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_snapshots_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      qualitative_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          response_answer_id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          response_answer_id: string
          tag: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          response_answer_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualitative_tags_response_answer_id_fkey"
            columns: ["response_answer_id"]
            isOneToOne: false
            referencedRelation: "response_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      qualitative_themes: {
        Row: {
          created_at: string | null
          id: string
          is_positive: boolean
          summary: string | null
          survey_id: string
          tag_cluster: string[]
          theme: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_positive?: boolean
          summary?: string | null
          survey_id: string
          tag_cluster?: string[]
          theme: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_positive?: boolean
          summary?: string | null
          survey_id?: string
          tag_cluster?: string[]
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualitative_themes_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      question_dimension_map: {
        Row: {
          dimension_id: string
          question_id: string
          weight: number
        }
        Insert: {
          dimension_id: string
          question_id: string
          weight?: number
        }
        Update: {
          dimension_id?: string
          question_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_dimension_map_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_dimension_map_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "v_dimension_scores"
            referencedColumns: ["dimension_id"]
          },
          {
            foreignKeyName: "question_dimension_map_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          question_id: string
          text: string
          value: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          question_id: string
          text: string
          value: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          question_id?: string
          text?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          conditional_config: Json
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          required: boolean
          survey_section_id: string
          text: string
          type: Database["public"]["Enums"]["question_type_enum"]
        }
        Insert: {
          conditional_config?: Json
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          required?: boolean
          survey_section_id: string
          text: string
          type: Database["public"]["Enums"]["question_type_enum"]
        }
        Update: {
          conditional_config?: Json
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          required?: boolean
          survey_section_id?: string
          text?: string
          type?: Database["public"]["Enums"]["question_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_survey_section_id_fkey"
            columns: ["survey_section_id"]
            isOneToOne: false
            referencedRelation: "survey_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      response_answers: {
        Row: {
          created_at: string | null
          id: string
          numeric_value: number | null
          question_id: string
          response_id: string
          selected_options: Json
          text_value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          numeric_value?: number | null
          question_id: string
          response_id: string
          selected_options?: Json
          text_value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          numeric_value?: number | null
          question_id?: string
          response_id?: string
          selected_options?: Json
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      response_drafts: {
        Row: {
          answers_draft: Json
          created_at: string | null
          id: string
          last_saved_at: string | null
          section_progress: Json
          survey_id: string
          user_id: string
        }
        Insert: {
          answers_draft?: Json
          created_at?: string | null
          id?: string
          last_saved_at?: string | null
          section_progress?: Json
          survey_id: string
          user_id: string
        }
        Update: {
          answers_draft?: Json
          created_at?: string | null
          id?: string
          last_saved_at?: string | null
          section_progress?: Json
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_drafts_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      response_metadata: {
        Row: {
          response_id: string
          segmentation_snapshot: Json
        }
        Insert: {
          response_id: string
          segmentation_snapshot?: Json
        }
        Update: {
          response_id?: string
          segmentation_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "response_metadata_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: true
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          is_anonymous: boolean
          role: string | null
          submitted_at: string
          survey_id: string
          tenure_band: string | null
          user_id: string | null
          work_type: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          is_anonymous?: boolean
          role?: string | null
          submitted_at?: string
          survey_id: string
          tenure_band?: string | null
          user_id?: string | null
          work_type?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          is_anonymous?: boolean
          role?: string | null
          submitted_at?: string
          survey_id?: string
          tenure_band?: string | null
          user_id?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      survey_audiences: {
        Row: {
          created_at: string | null
          id: string
          survey_id: string
          target_department_id: string | null
          target_role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          survey_id: string
          target_department_id?: string | null
          target_role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          survey_id?: string
          target_department_id?: string | null
          target_role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_audiences_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_audiences_target_department_id_fkey"
            columns: ["target_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_audiences_target_role_id_fkey"
            columns: ["target_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_sections: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          survey_id: string
          target_roles: string[]
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          survey_id: string
          target_roles?: string[]
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          survey_id?: string
          target_roles?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_sections_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          anonymous_mode: boolean
          archived: boolean
          closes_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          opens_at: string | null
          status: Database["public"]["Enums"]["survey_status_enum"]
          title: string
          version: number
        }
        Insert: {
          anonymous_mode?: boolean
          archived?: boolean
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          opens_at?: string | null
          status?: Database["public"]["Enums"]["survey_status_enum"]
          title: string
          version?: number
        }
        Update: {
          anonymous_mode?: boolean
          archived?: boolean
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          opens_at?: string | null
          status?: Database["public"]["Enums"]["survey_status_enum"]
          title?: string
          version?: number
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          department_id: string
          id: string
          manager_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          department_id: string
          id?: string
          manager_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          department_id?: string
          id?: string
          manager_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_teams_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_dimension_scores: {
        Row: {
          avg_score: number | null
          dimension_id: string | null
          dimension_name: string | null
          dimension_slug: string | null
          favorable_pct: number | null
          neutral_pct: number | null
          respondent_count: number | null
          survey_id: string | null
          unfavorable_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "derived_metrics_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      v_participation_rates: {
        Row: {
          department_id: string | null
          department_name: string | null
          survey_id: string | null
          token_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "participation_tokens_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_tokens_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      v_public_actions: {
        Row: {
          created_at: string | null
          department_id: string | null
          department_name: string | null
          id: string | null
          priority: Database["public"]["Enums"]["action_priority_enum"] | null
          problem_statement: string | null
          status: Database["public"]["Enums"]["action_status_enum"] | null
          success_criteria: string | null
          survey_id: string | null
          target_date: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      compute_derived_metrics: {
        Args: { p_survey_id: string }
        Returns: number
      }
      current_user_role: { Args: never; Returns: string }
      get_dimension_scores_for_survey: {
        Args: { p_min_respondents?: number; p_survey_id: string }
        Returns: {
          avg_score: number
          below_threshold: boolean
          dimension_id: string
          dimension_name: string
          dimension_slug: string
          favorable_pct: number
          neutral_pct: number
          respondent_count: number
          unfavorable_pct: number
        }[]
      }
    }
    Enums: {
      action_priority_enum: "low" | "medium" | "high" | "critical"
      action_status_enum:
        | "identified"
        | "planned"
        | "in_progress"
        | "blocked"
        | "completed"
      question_type_enum:
        | "likert_5"
        | "likert_10"
        | "single_select"
        | "multi_select"
        | "short_text"
        | "long_text"
      survey_status_enum: "draft" | "scheduled" | "open" | "closed"
      tenure_band_enum: "0-6m" | "6-12m" | "1-2y" | "2-5y" | "5y+"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
      action_priority_enum: ["low", "medium", "high", "critical"],
      action_status_enum: [
        "identified",
        "planned",
        "in_progress",
        "blocked",
        "completed",
      ],
      question_type_enum: [
        "likert_5",
        "likert_10",
        "single_select",
        "multi_select",
        "short_text",
        "long_text",
      ],
      survey_status_enum: ["draft", "scheduled", "open", "closed"],
      tenure_band_enum: ["0-6m", "6-12m", "1-2y", "2-5y", "5y+"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

