import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Issue, IssueType, IssuePriority, IssueStatus } from '@/types/issue';
import { toast } from 'sonner';

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
  reporter_id: string | null;
  reporter_email: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const mapDbIssueToIssue = (dbIssue: DbIssue): Issue => ({
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
  reporter_id: dbIssue.reporter_id ?? undefined,
  reporter_email: dbIssue.reporter_email ?? undefined,
  created_at: dbIssue.created_at,
  updated_at: dbIssue.updated_at,
  resolved_at: dbIssue.resolved_at ?? undefined,
});

export function useIssues() {
  return useQuery({
    queryKey: ['issues'],
    queryFn: async (): Promise<Issue[]> => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DbIssue[]).map(mapDbIssueToIssue);
    },
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: async (): Promise<Issue> => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapDbIssueToIssue(data as DbIssue);
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
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateIssueData) => {
      const { error } = await supabase
        .from('issues')
        .update(data)
        .eq('id', id);
      if (error) throw error;
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
