export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  bio: string | null;
  notification_email: boolean;
  notification_push: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  is_admin_update: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
}

export interface IssueUpvote {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface IssueFollow {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export type AdminRole = 'admin' | 'super_admin' | 'department_admin' | 'field_worker';

export const adminRoleLabels: Record<AdminRole, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  department_admin: 'Department Admin',
  field_worker: 'Field Worker',
};
