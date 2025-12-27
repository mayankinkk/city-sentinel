import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useUpvoteCount(issueId: string) {
  return useQuery({
    queryKey: ['upvote-count', issueId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('issue_upvotes')
        .select('*', { count: 'exact', head: true })
        .eq('issue_id', issueId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!issueId,
  });
}

export function useHasUpvoted(issueId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['has-upvoted', issueId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('issue_upvotes')
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

export function useToggleUpvote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (issueId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if already upvoted
      const { data: existing } = await supabase
        .from('issue_upvotes')
        .select('id')
        .eq('issue_id', issueId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Remove upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { added: false, issueId };
      } else {
        // Add upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .insert({
            issue_id: issueId,
            user_id: user.id,
          });

        if (error) throw error;
        return { added: true, issueId };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['upvote-count', result.issueId] });
      queryClient.invalidateQueries({ queryKey: ['has-upvoted', result.issueId, user?.id] });
      toast.success(result.added ? 'Upvoted!' : 'Removed upvote');
    },
    onError: (error: Error) => {
      toast.error('Failed to toggle upvote: ' + error.message);
    },
  });
}
