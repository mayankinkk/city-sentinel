export type IssueType =
  | 'pothole'
  | 'streetlight'
  | 'drainage'
  | 'garbage'
  | 'graffiti'
  | 'sidewalk'
  | 'traffic_sign'
  | 'water_leak'
  | 'other';

export type IssuePriority = 'low' | 'medium' | 'high';

export type IssueStatus = 'pending' | 'in_progress' | 'resolved' | 'withdrawn';

export interface Issue {
  id: string;
  title: string;
  description: string;
  issue_type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  address?: string;
  image_url?: string;
  reporter_id?: string;
  reporter_email?: string;
  department_id?: string;
  assigned_to?: string;
  terms_accepted?: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export const issueTypeLabels: Record<IssueType, string> = {
  pothole: 'Pothole',
  streetlight: 'Street Light',
  drainage: 'Drainage Issue',
  garbage: 'Garbage/Waste',
  graffiti: 'Graffiti',
  sidewalk: 'Sidewalk Damage',
  traffic_sign: 'Traffic Sign',
  water_leak: 'Water Leak',
  other: 'Other',
};

export const issueTypeIcons: Record<IssueType, string> = {
  pothole: '🕳️',
  streetlight: '💡',
  drainage: '🌊',
  garbage: '🗑️',
  graffiti: '🎨',
  sidewalk: '🚶',
  traffic_sign: '🚦',
  water_leak: '💧',
  other: '📍',
};

export const priorityLabels: Record<IssuePriority, string> = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
};

export const statusLabels: Record<IssueStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  withdrawn: 'Withdrawn',
};

export interface Notification {
  id: string;
  user_id: string;
  issue_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminInvite {
  id: string;
  email: string;
  invite_token: string;
  invited_by: string;
  used: boolean;
  used_at?: string;
  expires_at: string;
  created_at: string;
}
