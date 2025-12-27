import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IssueComment } from '@/types/profile';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useComments(issueId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', issueId],
    queryFn: async (): Promise<IssueComment[]> => {
      const { data, error } = await supabase
        .from('issue_comments')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles for comment authors
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null,
      })) as IssueComment[];
    },
    enabled: !!issueId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!issueId) return;

    const channel = supabase
      .channel(`comments-${issueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issue_comments',
          filter: `issue_id=eq.${issueId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, queryClient]);

  return query;
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ issueId, content, isAdminUpdate = false }: { 
      issueId: string; 
      content: string; 
      isAdminUpdate?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: issueId,
          user_id: user.id,
          content,
          is_admin_update: isAdmin && isAdminUpdate,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.issueId] });
      toast.success('Comment added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add comment: ' + error.message);
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, issueId }: { commentId: string; issueId: string }) => {
      const { error } = await supabase
        .from('issue_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return issueId;
    },
    onSuccess: (issueId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
      toast.success('Comment deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete comment: ' + error.message);
    },
  });
}
