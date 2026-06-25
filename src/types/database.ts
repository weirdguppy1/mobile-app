export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          school_domain: string | null;
          first_name: string | null;
          pronouns: string | null;
          university: string | null;
          graduation_year: number | null;
          majors: string[] | null;
          gender_identity: string | null;
          sex_assigned_at_birth: string | null;
          sexual_orientation: string | null;
          sleep_schedule: string | null;
          bedtime: string | null;
          wakeup_time: string | null;
          cleanliness: number | null;
          noise_preference: string | null;
          study_style: string | null;
          guests_frequency: string | null;
          romantic_guests_frequency: string | null;
          social_level: number | null;
          room_temperature: string | null;
          alcohol: string | null;
          smoking: string | null;
          parties: string | null;
          fitness: string | null;
          interests: string[] | null;
          deal_breakers: string[] | null;
          dorm_preference: string | null;
          living_program: string | null;
          clubs: string[] | null;
          instagram: string | null;
          linkedin: string | null;
          about_me: string | null;
          hidden_fields: string[];
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      profile_photos: {
        Row: { id: string; profile_id: string; url: string; position: number; created_at: string };
        Insert: { id?: string; profile_id: string; url: string; position?: number; created_at?: string };
        Update: Partial<Database['public']['Tables']['profile_photos']['Row']>;
        Relationships: [];
      };
      profile_prompts: {
        Row: { id: string; profile_id: string; prompt: string; answer: string; position: number; created_at: string };
        Insert: { id?: string; profile_id: string; prompt: string; answer: string; position?: number; created_at?: string };
        Update: Partial<Database['public']['Tables']['profile_prompts']['Row']>;
        Relationships: [];
      };
      private_contacts: {
        Row: { profile_id: string; phone: string | null; updated_at: string };
        Insert: { profile_id: string; phone?: string | null; updated_at?: string };
        Update: Partial<Database['public']['Tables']['private_contacts']['Row']>;
        Relationships: [];
      };
      likes: {
        Row: {
          liker_id: string;
          likee_id: string;
          liked_photo_id: string | null;
          liked_prompt_id: string | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          liker_id: string;
          likee_id: string;
          liked_photo_id?: string | null;
          liked_prompt_id?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['likes']['Row']>;
        Relationships: [];
      };
      passes: {
        Row: { passer_id: string; passee_id: string; created_at: string };
        Insert: { passer_id: string; passee_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['passes']['Row']>;
        Relationships: [];
      };
      matches: {
        Row: { id: string; user_a: string; user_b: string; created_at: string };
        Insert: { id?: string; user_a: string; user_b: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['matches']['Row']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Row']>;
        Relationships: [];
      };
      message_reactions: {
        Row: {
          message_id: string;
          match_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          message_id: string;
          match_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['message_reactions']['Row']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'message' | 'match' | 'request' | 'reaction';
          actor_id: string;
          match_id: string | null;
          message_id: string | null;
          preview: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'message' | 'match' | 'request' | 'reaction';
          actor_id: string;
          match_id?: string | null;
          message_id?: string | null;
          preview?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      complete_onboarding: {
        Args: { target_profile_id: string };
        Returns: undefined;
      };
      replace_prompts: {
        Args: { p_profile_id: string; p_prompts: { prompt: string; answer: string }[] };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
