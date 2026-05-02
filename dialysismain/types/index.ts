export interface DialysisRecord {
  id?: string;
  record_id: string;
  first_name: string;
  last_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  machine_number: string;
  dialyzer_type: string;
  pre_bp: string;
  pre_weight: number;
  post_bp: string;
  post_weight: number;
  uf_goal: number;
  fluid_removed: number;
  nurse: string;
  remarks: string;
  created_at?: string;
}

export interface UserSession {
  username: string;
  isAdmin: boolean;
}
