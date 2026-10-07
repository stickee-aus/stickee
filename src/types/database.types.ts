// Generated via `supabase gen types typescript --local` against the local
// dev database (migrations 001-017 applied). This is the first time this
// file has existed in the repo — the app currently uses hand-written,
// per-file inline types for DB rows (e.g. DBWalletRow in
// usePredictionWallet.ts) rather than importing from here. Wiring the app
// over to import from this file is future work (see
// docs/audits/DATABASE_VERIFICATION_REPORT.md and docs/audits/OUTSOURCING_PLAN.md ticket 8),
// deliberately not done in this batch to avoid unrelated churn. Regenerate
// with: supabase start && supabase db reset && supabase gen types
// typescript --local > src/types/database.types.ts
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
      agent_runs: {
        Row: {
          agent_id: string
          error: string | null
          finished_at: string | null
          id: string
          items_processed: number
          items_written: number
          started_at: string
          status: string
          summary: string | null
          trigger: string
        }
        Insert: {
          agent_id: string
          error?: string | null
          finished_at?: string | null
          id?: string
          items_processed?: number
          items_written?: number
          started_at?: string
          status?: string
          summary?: string | null
          trigger?: string
        }
        Update: {
          agent_id?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          items_processed?: number
          items_written?: number
          started_at?: string
          status?: string
          summary?: string | null
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          config: Json
          created_at: string
          description: string
          enabled: boolean
          id: string
          last_items: number
          last_run_at: string | null
          last_status: string | null
          last_summary: string | null
          name: string
          next_run_at: string | null
          schedule_cron: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description: string
          enabled?: boolean
          id: string
          last_items?: number
          last_run_at?: string | null
          last_status?: string | null
          last_summary?: string | null
          name: string
          next_run_at?: string | null
          schedule_cron?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          last_items?: number
          last_run_at?: string | null
          last_status?: string | null
          last_summary?: string | null
          name?: string
          next_run_at?: string | null
          schedule_cron?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_pressures: {
        Row: {
          action_type: string
          bill_id: string
          created_at: string
          electorate: string | null
          id: string
          session_id: string | null
          stance: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          bill_id: string
          created_at?: string
          electorate?: string | null
          id?: string
          session_id?: string | null
          stance: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          bill_id?: string
          created_at?: string
          electorate?: string | null
          id?: string
          session_id?: string | null
          stance?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_handle: string | null
          author_name: string
          body: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          author_handle?: string | null
          author_name?: string
          body: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          author_handle?: string | null
          author_name?: string
          body?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      divisions: {
        Row: {
          abstain_count: number | null
          aye_count: number | null
          date: string
          house: string | null
          id: string
          name: string
          no_count: number | null
          passed: boolean | null
          source_url: string | null
          summary: string | null
          synced_at: string | null
          tvfy_id: number
        }
        Insert: {
          abstain_count?: number | null
          aye_count?: number | null
          date: string
          house?: string | null
          id?: string
          name: string
          no_count?: number | null
          passed?: boolean | null
          source_url?: string | null
          summary?: string | null
          synced_at?: string | null
          tvfy_id: number
        }
        Update: {
          abstain_count?: number | null
          aye_count?: number | null
          date?: string
          house?: string | null
          id?: string
          name?: string
          no_count?: number | null
          passed?: boolean | null
          source_url?: string | null
          summary?: string | null
          synced_at?: string | null
          tvfy_id?: number
        }
        Relationships: []
      }
      donation_records: {
        Row: {
          amount_cents: number | null
          cadence: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          source: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          cadence?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          source?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          cadence?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          source?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feed_impressions: {
        Row: {
          created_at: string
          dwell_ms: number | null
          id: number
          post_id: string
          surface: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dwell_ms?: number | null
          id?: number
          post_id: string
          surface?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dwell_ms?: number | null
          id?: number
          post_id?: string
          surface?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          author_handle: string
          author_id: string | null
          author_name: string
          author_verified: boolean
          civic_score: number | null
          comment_count: number
          content: string
          created_at: string
          fires: number
          flags: number
          hearts: number
          id: string
          is_boost: boolean
          linked_bill_id: string | null
          linked_decision_id: string | null
          linked_electorate: string | null
          linked_leader_id: string | null
          linked_pillar_id: string | null
          posted_at: string
          share_count: number
          source_agent_id: string | null
          type: string
        }
        Insert: {
          author_handle: string
          author_id?: string | null
          author_name: string
          author_verified?: boolean
          civic_score?: number | null
          comment_count?: number
          content: string
          created_at?: string
          fires?: number
          flags?: number
          hearts?: number
          id: string
          is_boost?: boolean
          linked_bill_id?: string | null
          linked_decision_id?: string | null
          linked_electorate?: string | null
          linked_leader_id?: string | null
          linked_pillar_id?: string | null
          posted_at?: string
          share_count?: number
          source_agent_id?: string | null
          type: string
        }
        Update: {
          author_handle?: string
          author_id?: string | null
          author_name?: string
          author_verified?: boolean
          civic_score?: number | null
          comment_count?: number
          content?: string
          created_at?: string
          fires?: number
          flags?: number
          hearts?: number
          id?: string
          is_boost?: boolean
          linked_bill_id?: string | null
          linked_decision_id?: string | null
          linked_electorate?: string | null
          linked_leader_id?: string | null
          linked_pillar_id?: string | null
          posted_at?: string
          share_count?: number
          source_agent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_source_agent_id_fkey"
            columns: ["source_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      issue_markets: {
        Row: {
          category: string
          closes_at: string | null
          is_test_fixture: boolean
          issue_id: string
          no_volume: number
          opens_at: string | null
          outcome: string | null
          probability: number
          question: string
          resolution_source: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolves_by: string
          status: string
          total_participants: number
          updated_at: string
          yes_change: number
          yes_history: number[]
          yes_volume: number
        }
        Insert: {
          category?: string
          closes_at?: string | null
          is_test_fixture?: boolean
          issue_id: string
          no_volume?: number
          opens_at?: string | null
          outcome?: string | null
          probability: number
          question: string
          resolution_source?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolves_by: string
          status?: string
          total_participants?: number
          updated_at?: string
          yes_change?: number
          yes_history?: number[]
          yes_volume?: number
        }
        Update: {
          category?: string
          closes_at?: string | null
          is_test_fixture?: boolean
          issue_id?: string
          no_volume?: number
          opens_at?: string | null
          outcome?: string | null
          probability?: number
          question?: string
          resolution_source?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolves_by?: string
          status?: string
          total_participants?: number
          updated_at?: string
          yes_change?: number
          yes_history?: number[]
          yes_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "issue_markets_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: true
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          content: string
          created_at: string
          id: string
          is_test_fixture: boolean
          mp_abstain_count: number
          mp_no_count: number
          mp_yes_count: number
          source_url: string | null
          status: string
          summary: string
          title: string
          updated_at: string
          what_is_happening: string
          who_opposes: string
          who_supports: string
        }
        Insert: {
          content?: string
          created_at?: string
          id: string
          is_test_fixture?: boolean
          mp_abstain_count?: number
          mp_no_count?: number
          mp_yes_count?: number
          source_url?: string | null
          status: string
          summary: string
          title: string
          updated_at?: string
          what_is_happening?: string
          who_opposes?: string
          who_supports?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_test_fixture?: boolean
          mp_abstain_count?: number
          mp_no_count?: number
          mp_yes_count?: number
          source_url?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          what_is_happening?: string
          who_opposes?: string
          who_supports?: string
        }
        Relationships: []
      }
      leader_supports: {
        Row: {
          availability: string | null
          created_at: string
          id: string
          is_public: boolean
          leader_id: string
          postcode: string | null
          skills: string[]
          state: string | null
          support_types: string[]
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          leader_id: string
          postcode?: string | null
          skills?: string[]
          state?: string | null
          support_types: string[]
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          leader_id?: string
          postcode?: string | null
          skills?: string[]
          state?: string | null
          support_types?: string[]
          user_id?: string
        }
        Relationships: []
      }
      member_votes: {
        Row: {
          division_tvfy_id: number
          id: string
          member_tvfy_id: number
          vote: string
        }
        Insert: {
          division_tvfy_id: number
          id?: string
          member_tvfy_id: number
          vote: string
        }
        Update: {
          division_tvfy_id?: number
          id?: string
          member_tvfy_id?: number
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_votes_division_tvfy_id_fkey"
            columns: ["division_tvfy_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["tvfy_id"]
          },
          {
            foreignKeyName: "member_votes_member_tvfy_id_fkey"
            columns: ["member_tvfy_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["tvfy_id"]
          },
        ]
      }
      members: {
        Row: {
          electorate: string | null
          house: string | null
          id: string
          image_url: string | null
          name: string
          party: string | null
          synced_at: string | null
          tvfy_id: number
        }
        Insert: {
          electorate?: string | null
          house?: string | null
          id?: string
          image_url?: string | null
          name: string
          party?: string | null
          synced_at?: string | null
          tvfy_id: number
        }
        Update: {
          electorate?: string | null
          house?: string | null
          id?: string
          image_url?: string | null
          name?: string
          party?: string | null
          synced_at?: string | null
          tvfy_id?: number
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          notes: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          href: string | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          href?: string | null
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          href?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_events: {
        Row: {
          created_at: string
          electorate: string | null
          first_action: string | null
          id: string
          source: string
          top_issues: string[]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          electorate?: string | null
          first_action?: string | null
          id?: string
          source?: string
          top_issues?: string[]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          electorate?: string | null
          first_action?: string | null
          id?: string
          source?: string
          top_issues?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      pillar_metrics: {
        Row: {
          id: string
          insight: string
          label: string
          metric_id: string
          period: string
          pillar_id: Database["public"]["Enums"]["civic_pillar_id"]
          positive_when_up: boolean
          previous_value: number
          source: string
          status: Database["public"]["Enums"]["civic_status"]
          synced_at: string
          trend_direction: Database["public"]["Enums"]["trend_direction"]
          trend_percent: number
          unit: string
          value: number
        }
        Insert: {
          id?: string
          insight: string
          label: string
          metric_id: string
          period: string
          pillar_id: Database["public"]["Enums"]["civic_pillar_id"]
          positive_when_up?: boolean
          previous_value: number
          source: string
          status: Database["public"]["Enums"]["civic_status"]
          synced_at?: string
          trend_direction: Database["public"]["Enums"]["trend_direction"]
          trend_percent: number
          unit: string
          value: number
        }
        Update: {
          id?: string
          insight?: string
          label?: string
          metric_id?: string
          period?: string
          pillar_id?: Database["public"]["Enums"]["civic_pillar_id"]
          positive_when_up?: boolean
          previous_value?: number
          source?: string
          status?: Database["public"]["Enums"]["civic_status"]
          synced_at?: string
          trend_direction?: Database["public"]["Enums"]["trend_direction"]
          trend_percent?: number
          unit?: string
          value?: number
        }
        Relationships: []
      }
      pillar_scores: {
        Row: {
          civic_score: number
          headline: string
          id: string
          lga: string | null
          period: string
          pillar_id: Database["public"]["Enums"]["civic_pillar_id"]
          state: string | null
          status: Database["public"]["Enums"]["civic_status"]
          summary: string
          synced_at: string
          trend_direction: Database["public"]["Enums"]["trend_direction"]
          trend_percent: number
        }
        Insert: {
          civic_score: number
          headline: string
          id?: string
          lga?: string | null
          period: string
          pillar_id: Database["public"]["Enums"]["civic_pillar_id"]
          state?: string | null
          status: Database["public"]["Enums"]["civic_status"]
          summary: string
          synced_at?: string
          trend_direction: Database["public"]["Enums"]["trend_direction"]
          trend_percent: number
        }
        Update: {
          civic_score?: number
          headline?: string
          id?: string
          lga?: string | null
          period?: string
          pillar_id?: Database["public"]["Enums"]["civic_pillar_id"]
          state?: string | null
          status?: Database["public"]["Enums"]["civic_status"]
          summary?: string
          synced_at?: string
          trend_direction?: Database["public"]["Enums"]["trend_direction"]
          trend_percent?: number
        }
        Relationships: []
      }
      pillar_time_series: {
        Row: {
          date: string
          id: string
          metric_id: string
          value: number
        }
        Insert: {
          date: string
          id?: string
          metric_id: string
          value: number
        }
        Update: {
          date?: string
          id?: string
          metric_id?: string
          value?: number
        }
        Relationships: []
      }
      politician_pillar_ratings: {
        Row: {
          civic_score: number
          id: string
          key_actions: string[]
          period: string
          pillar_id: Database["public"]["Enums"]["civic_pillar_id"]
          politician_id: string
          rationale: string
          score: number
          status: Database["public"]["Enums"]["civic_status"]
          synced_at: string
        }
        Insert: {
          civic_score: number
          id?: string
          key_actions?: string[]
          period: string
          pillar_id: Database["public"]["Enums"]["civic_pillar_id"]
          politician_id: string
          rationale: string
          score: number
          status: Database["public"]["Enums"]["civic_status"]
          synced_at?: string
        }
        Update: {
          civic_score?: number
          id?: string
          key_actions?: string[]
          period?: string
          pillar_id?: Database["public"]["Enums"]["civic_pillar_id"]
          politician_id?: string
          rationale?: string
          score?: number
          status?: Database["public"]["Enums"]["civic_status"]
          synced_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string
          prediction: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id: string
          prediction: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string
          prediction?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scoring_weights: {
        Row: {
          config_name: string
          created_at: string
          id: string
          metric_weights: Json
          pillar_weights: Json
        }
        Insert: {
          config_name: string
          created_at?: string
          id?: string
          metric_weights?: Json
          pillar_weights: Json
        }
        Update: {
          config_name?: string
          created_at?: string
          id?: string
          metric_weights?: Json
          pillar_weights?: Json
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          civic_score: number | null
          created_at: string | null
          display_name: string | null
          electorate: string | null
          handle: string | null
          onboarding_completed_at: string | null
          onboarding_first_action: string | null
          top_issues: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          civic_score?: number | null
          created_at?: string | null
          display_name?: string | null
          electorate?: string | null
          handle?: string | null
          onboarding_completed_at?: string | null
          onboarding_first_action?: string | null
          top_issues?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          civic_score?: number | null
          created_at?: string | null
          display_name?: string | null
          electorate?: string | null
          handle?: string | null
          onboarding_completed_at?: string | null
          onboarding_first_action?: string | null
          top_issues?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_count: number
          freezes_available: number
          last_action_date: string | null
          longest_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_count?: number
          freezes_available?: number
          last_action_date?: string | null
          longest_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_count?: number
          freezes_available?: number
          last_action_date?: string | null
          longest_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          last_daily_bonus: string | null
          total_earned: number
          total_staked: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          last_daily_bonus?: string | null
          total_earned?: number
          total_staked?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          last_daily_bonus?: string | null
          total_earned?: number
          total_staked?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_positions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          direction: string
          id: string
          market_id: string
          market_question: string
          payout: number | null
          price: number
          settled_at: string | null
          shares: number
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          direction: string
          id?: string
          market_id: string
          market_question: string
          payout?: number | null
          price: number
          settled_at?: string | null
          shares: number
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          direction?: string
          id?: string
          market_id?: string
          market_question?: string
          payout?: number | null
          price?: number
          settled_at?: string | null
          shares?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      feed_reaction_counts: {
        Row: {
          post_id: string | null
          reaction: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_daily_bonus: {
        Args: { p_amount: number; p_today: string; p_user_id: string }
        Returns: boolean
      }
      decrement_feed_count: {
        Args: { p_col: string; p_post_id: string }
        Returns: undefined
      }
      increment_feed_count: {
        Args: { p_col: string; p_post_id: string }
        Returns: undefined
      }
      is_app_admin: { Args: never; Returns: boolean }
      is_market_open: { Args: { p_issue_id: string }; Returns: boolean }
      place_wallet_stake: {
        Args: {
          p_amount: number
          p_category: string
          p_direction: string
          p_market_id: string
          p_market_question: string
          p_price: number
        }
        Returns: {
          new_balance: number
          position_id: string
        }[]
      }
      resolve_market: {
        Args: {
          p_issue_id: string
          p_outcome: string
          p_resolution_source: string
        }
        Returns: {
          already_resolved: boolean
          positions_settled: number
          total_paid: number
        }[]
      }
    }
    Enums: {
      civic_pillar_id:
        | "cost-of-living"
        | "housing"
        | "crime-safety"
        | "jobs-economy"
        | "future"
      civic_status: "green" | "yellow" | "red"
      trend_direction: "improving" | "stable" | "worsening"
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
      civic_pillar_id: [
        "cost-of-living",
        "housing",
        "crime-safety",
        "jobs-economy",
        "future",
      ],
      civic_status: ["green", "yellow", "red"],
      trend_direction: ["improving", "stable", "worsening"],
    },
  },
} as const
