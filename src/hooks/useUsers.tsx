import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppRole } from '@/hooks/useAuth';

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: AppRole[];
  departments: { id: string; name: string }[];
  created_at: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get all profiles using the public view (non-PII fields only)
      // Admins access this hook for user management, so they have access via RLS policy
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, created_at');

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get all user departments
      const { data: userDepts, error: deptError } = await supabase
        .from('user_departments')
        .select('user_id, department_id, departments(id, name)');

      if (deptError) throw deptError;

      // Log profile access for audit trail (admin users only)
      // This is done asynchronously and doesn't block the query
      if (profiles && profiles.length > 0) {
        // Log bulk access with context - fire and forget
        profiles.forEach(profile => {
          void supabase.rpc('log_profile_access', { 
            p_profile_id: profile.user_id,
            p_context: 'user_management'
          });
        });
      }

      // Get auth users emails using a custom approach since we can't query auth.users directly
      // We'll use the profiles and combine with the data we have
      const users: UserWithRoles[] = profiles?.map(profile => {
        const userRoles = allRoles
          ?.filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole) || [];
        
        const userDepartments = userDepts
          ?.filter(d => d.user_id === profile.user_id)
          .map(d => ({
            id: (d.departments as any)?.id || d.department_id,
            name: (d.departments as any)?.name || 'Unknown'
          })) || [];

        return {
          id: profile.user_id,
          email: '', // Will be filled from auth metadata if available
          full_name: profile.full_name,
          roles: userRoles,
          departments: userDepartments,
          created_at: profile.created_at,
        };
      }) || [];

      return users;
    },
  });
}

export function useAddUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add role: ${error.message}`);
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });
}

export function useAssignDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, departmentId }: { userId: string; departmentId: string }) => {
      const { error } = await supabase
        .from('user_departments')
        .insert({ user_id: userId, department_id: departmentId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Department assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign department: ${error.message}`);
    },
  });
}

export function useRemoveDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, departmentId }: { userId: string; departmentId: string }) => {
      const { error } = await supabase
        .from('user_departments')
        .delete()
        .eq('user_id', userId)
        .eq('department_id', departmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Department removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove department: ${error.message}`);
    },
  });
}
