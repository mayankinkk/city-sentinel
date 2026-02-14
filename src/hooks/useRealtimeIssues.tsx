import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook that subscribes to realtime changes on the issues table
 * and automatically invalidates the issues query cache.
 */
export function useRealtimeIssues() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('issues-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
        },
        (payload) => {
          // Invalidate queries so UI updates
          queryClient.invalidateQueries({ queryKey: ['issues'] });
          
          if (payload.eventType === 'INSERT') {
            toast.info('New issue reported', {
              description: (payload.new as any)?.title || 'A new issue has been submitted.',
              duration: 4000,
            });
          }
          
          if (payload.eventType === 'UPDATE') {
            queryClient.invalidateQueries({ queryKey: ['issue', (payload.new as any)?.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
