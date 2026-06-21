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
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
