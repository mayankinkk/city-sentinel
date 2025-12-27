import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useIsFollowing(issueId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-following', issueId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('issue_follows')
        .select('id')
        .eq('issue_id', issueId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!issueId && !!user,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (issueId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if already following
      const { data: existing } = await supabase
        .from('issue_follows')
        .select('id')
        .eq('issue_id', issueId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Unfollow
        const { error } = await supabase
          .from('issue_follows')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { following: false, issueId };
      } else {
        // Follow
        const { error } = await supabase
          .from('issue_follows')
          .insert({
            issue_id: issueId,
            user_id: user.id,
          });

        if (error) throw error;
        return { following: true, issueId };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', result.issueId, user?.id] });
      toast.success(result.following ? 'Following issue' : 'Unfollowed issue');
    },
    onError: (error: Error) => {
      toast.error('Failed to toggle follow: ' + error.message);
    },
  });
}

export function useFollowedIssues() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followed-issues', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('issue_follows')
        .select(`
          id,
          issue_id,
          created_at,
          issue:issues(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
