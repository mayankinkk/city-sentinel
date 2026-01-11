import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Issue, IssueType, IssuePriority, IssueStatus, VerificationStatus } from '@/types/issue';
import { toast } from 'sonner';

// Type for full issue data (accessible to privileged users)
type DbIssue = {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  priority: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
  image_url: string | null;
  resolved_image_url: string | null;
  reporter_id: string | null;
  reporter_email: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

// Type for public issue data (without sensitive fields like reporter_email)
type DbIssuePublic = Omit<DbIssue, 'reporter_email'>;

const mapDbIssueToIssue = (dbIssue: DbIssue | DbIssuePublic): Issue => ({
  id: dbIssue.id,
  title: dbIssue.title,
  description: dbIssue.description,
  issue_type: dbIssue.issue_type as IssueType,
  priority: dbIssue.priority as IssuePriority,
  status: dbIssue.status as IssueStatus,
  latitude: dbIssue.latitude,
  longitude: dbIssue.longitude,
  address: dbIssue.address ?? undefined,
  image_url: dbIssue.image_url ?? undefined,
  resolved_image_url: dbIssue.resolved_image_url ?? undefined,
  reporter_id: dbIssue.reporter_id ?? undefined,
  reporter_email: 'reporter_email' in dbIssue ? (dbIssue.reporter_email ?? undefined) : undefined,
  verification_status: (dbIssue.verification_status as VerificationStatus) ?? undefined,
  verified_by: dbIssue.verified_by ?? undefined,
  verified_at: dbIssue.verified_at ?? undefined,
  verification_notes: dbIssue.verification_notes ?? undefined,
  created_at: dbIssue.created_at,
  updated_at: dbIssue.updated_at,
  resolved_at: dbIssue.resolved_at ?? undefined,
});

export function useIssues() {
  return useQuery({
    queryKey: ['issues'],
    queryFn: async (): Promise<Issue[]> => {
      // First try to get from the full issues table (for privileged users)
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      // If user has access to full table, return that data
      if (!error && data && data.length > 0) {
        return (data as DbIssue[]).map(mapDbIssueToIssue);
      }

      // Fall back to public view for non-privileged users
      // This view excludes sensitive data like reporter_email
      const { data: publicData, error: publicError } = await supabase
        .from('issues_public')
        .select('*')
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;
      return (publicData as DbIssuePublic[]).map(mapDbIssueToIssue);
    },
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: async (): Promise<Issue> => {
      // Try full table first (for privileged users or issue owners)
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();

      // If user has access to full table, return that data
      if (!error && data) {
        return mapDbIssueToIssue(data as DbIssue);
      }

      // Fall back to public view for non-privileged users
      const { data: publicData, error: publicError } = await supabase
        .from('issues_public')
        .select('*')
        .eq('id', id)
        .single();

      if (publicError) throw publicError;
      return mapDbIssueToIssue(publicData as DbIssuePublic);
    },
    enabled: !!id,
  });
}

interface CreateIssueData {
  title: string;
  description: string;
  issue_type: IssueType;
  priority: IssuePriority;
  latitude: number;
  longitude: number;
  address?: string;
  image_url?: string;
  reporter_id?: string;
  reporter_email?: string;
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIssueData) => {
      const { error } = await supabase.from('issues').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue reported successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to report issue: ${error.message}`);
    },
  });
}

interface UpdateIssueData {
  id: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  resolved_at?: string | null;
  resolved_image_url?: string;
  verification_status?: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateIssueData) => {
      // Get current issue to track old status
      const { data: currentIssue } = await supabase
        .from('issues')
        .select('status, reporter_id')
        .eq('id', id)
        .single();

      const oldStatus = currentIssue?.status;

      const { error } = await supabase
        .from('issues')
        .update(data)
        .eq('id', id);
      if (error) throw error;

      // Trigger notification if status changed and there's a reporter
      if (data.status && oldStatus && data.status !== oldStatus && currentIssue?.reporter_id) {
        const { error: notifyError } = await supabase.functions.invoke('notify-status-change', {
          body: {
            issue_id: id,
            old_status: oldStatus,
            new_status: data.status,
          },
        });

        if (notifyError) {
          console.error('notify-status-change failed:', notifyError);
          toast.error('Could not deliver notifications for this status update.');
          // Don't fail the update if notification fails
        } else {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update issue: ${error.message}`);
    },
  });
}

export function useVerifyIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      verification_status, 
      verified_by, 
      verification_notes 
    }: { 
      id: string; 
      verification_status: VerificationStatus; 
      verified_by: string;
      verification_notes?: string;
    }) => {
      const { error } = await supabase
        .from('issues')
        .update({
          verification_status,
          verified_by,
          verified_at: new Date().toISOString(),
          verification_notes,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue verification updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to verify issue: ${error.message}`);
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('issues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete issue: ${error.message}`);
    },
  });
}
