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

export type IssueStatus = 'pending' | 'in_progress' | 'resolved';

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
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export const issueTypeLabels: Record<IssueType, string> = {
  pothole: 'Pothole',
  streetlight: 'Street Light',
  drainage: 'Drainage',
  garbage: 'Garbage',
  graffiti: 'Graffiti',
  sidewalk: 'Sidewalk',
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
  other: '❓',
};

export const priorityLabels: Record<IssuePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const statusLabels: Record<IssueStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};
