import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Department } from '@/types/profile';
import { toast } from 'sonner';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Department[];
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { error } = await supabase
        .from('departments')
        .insert({ name, description });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create department: ' + error.message);
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete department: ' + error.message);
    },
  });
}
