import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminInvite } from '@/types/issue';
import { toast } from 'sonner';

export function useAdminInvites() {
  return useQuery({
    queryKey: ['admin-invites'],
    queryFn: async (): Promise<AdminInvite[]> => {
      const { data, error } = await supabase
        .from('admin_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminInvite[];
    },
  });
}

export function useCreateAdminInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      // Generate a secure invite token
      const inviteToken = crypto.randomUUID();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('admin_invites').insert([
        {
          email,
          invite_token: inviteToken,
          invited_by: user.id,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('An invite has already been sent to this email');
        }
        throw error;
      }

      return inviteToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
      toast.success('Admin invite created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAdminInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_invites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
      toast.success('Invite deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export async function validateInviteToken(token: string): Promise<AdminInvite | null> {
  const { data, error } = await supabase
    .from('admin_invites')
    .select('*')
    .eq('invite_token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;
  return data as AdminInvite;
}

export async function useInviteToken(token: string, userId: string): Promise<boolean> {
  // Mark invite as used
  const { error: updateError } = await supabase
    .from('admin_invites')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('invite_token', token);

  if (updateError) return false;

  // Add admin role to user
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert([{ user_id: userId, role: 'admin' }]);

  if (roleError && roleError.code !== '23505') return false;
  
  return true;
}
