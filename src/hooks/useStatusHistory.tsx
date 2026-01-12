import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AddStatusHistoryData {
  issue_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_by_name?: string;
  changed_by_role?: string;
  notes?: string;
}

export function useAddStatusHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddStatusHistoryData) => {
      const { error } = await supabase
        .from('issue_status_history')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['status-history', variables.issue_id] });
    },
  });
}
