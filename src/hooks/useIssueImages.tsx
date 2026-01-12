import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IssueImage {
  id: string;
  issue_id: string;
  image_url: string;
  image_type: 'reported' | 'resolved' | 'additional';
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useIssueImages(issueId: string) {
  return useQuery({
    queryKey: ['issue-images', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_images')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as IssueImage[];
    },
    enabled: !!issueId,
  });
}

interface AddIssueImageData {
  issue_id: string;
  image_url: string;
  image_type: 'reported' | 'resolved' | 'additional';
  caption?: string;
  uploaded_by?: string;
}

export function useAddIssueImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddIssueImageData) => {
      const { error } = await supabase
        .from('issue_images')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-images', variables.issue_id] });
      toast.success('Image added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add image: ${error.message}`);
    },
  });
}

export function useDeleteIssueImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, issueId }: { id: string; issueId: string }) => {
      const { error } = await supabase
        .from('issue_images')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return issueId;
    },
    onSuccess: (issueId) => {
      queryClient.invalidateQueries({ queryKey: ['issue-images', issueId] });
      toast.success('Image deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete image: ${error.message}`);
    },
  });
}
