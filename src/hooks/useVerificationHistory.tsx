import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VerificationStatus } from '@/types/issue';
import { toast } from 'sonner';

export interface VerificationHistoryEntry {
  id: string;
  issue_id: string;
  verification_status: VerificationStatus;
  verified_by: string;
  verifier_name: string | null;
  verifier_role: string | null;
  verification_notes: string | null;
  created_at: string;
}

export function useVerificationHistory(issueId: string) {
  return useQuery({
    queryKey: ['verification-history', issueId],
    queryFn: async (): Promise<VerificationHistoryEntry[]> => {
      const { data, error } = await supabase
        .from('verification_history')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VerificationHistoryEntry[];
    },
    enabled: !!issueId,
  });
}

interface AddVerificationHistoryData {
  issue_id: string;
  verification_status: VerificationStatus;
  verified_by: string;
  verifier_name?: string;
  verifier_role?: string;
  verification_notes?: string;
}

export function useAddVerificationHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddVerificationHistoryData) => {
      const { error } = await supabase
        .from('verification_history')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['verification-history', variables.issue_id] });
    },
    onError: (error: Error) => {
      console.error('Failed to add verification history:', error);
    },
  });
}
