export interface User {
  id: string;
  clerk_id: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  created_at: Date;
  uuid: string;
}

export interface UserWithCredits extends User {
  credits?: {
    left_credits: number;
    one_time_credits: number;
    monthly_credits: number;
    total_credits: number;
    used_credits: number;
  };
}
