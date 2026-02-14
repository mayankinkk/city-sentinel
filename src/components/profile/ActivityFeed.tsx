import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  ThumbsUp, 
  Bell, 
  Loader2,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'report' | 'comment' | 'upvote' | 'follow';
  title: string;
  description: string;
  issue_id: string;
  created_at: string;
}

function useActivityFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-feed', user?.id],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!user) return [];

      const activities: ActivityItem[] = [];

      // Fetch user's reported issues
      const { data: issues } = await supabase
        .from('issues')
        .select('id, title, created_at')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      issues?.forEach(issue => {
        activities.push({
          id: `report-${issue.id}`,
          type: 'report',
          title: 'Reported an issue',
          description: issue.title,
          issue_id: issue.id,
          created_at: issue.created_at,
        });
      });

      // Fetch user's comments
      const { data: comments } = await supabase
        .from('issue_comments')
        .select('id, content, issue_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      comments?.forEach(comment => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          title: 'Commented on an issue',
          description: comment.content.substring(0, 80),
          issue_id: comment.issue_id,
          created_at: comment.created_at,
        });
      });

      // Fetch user's upvotes
      const { data: upvotes } = await supabase
        .from('issue_upvotes')
        .select('id, issue_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      upvotes?.forEach(upvote => {
        activities.push({
          id: `upvote-${upvote.id}`,
          type: 'upvote',
          title: 'Upvoted an issue',
          description: '',
          issue_id: upvote.issue_id,
          created_at: upvote.created_at,
        });
      });

      // Fetch user's follows
      const { data: follows } = await supabase
        .from('issue_follows')
        .select('id, issue_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      follows?.forEach(follow => {
        activities.push({
          id: `follow-${follow.id}`,
          type: 'follow',
          title: 'Started following an issue',
          description: '',
          issue_id: follow.issue_id,
          created_at: follow.created_at,
        });
      });

      // Sort all by date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return activities.slice(0, 30);
    },
    enabled: !!user,
  });
}

const activityIcons = {
  report: FileText,
  comment: MessageSquare,
  upvote: ThumbsUp,
  follow: Bell,
};

const activityColors = {
  report: 'text-primary',
  comment: 'text-accent',
  upvote: 'text-amber-500',
  follow: 'text-pink-500',
};

export function ActivityFeed() {
  const { data: activities, isLoading } = useActivityFeed();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Timeline
        </CardTitle>
        <CardDescription>Your recent activity across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity yet. Start by reporting an issue!</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
            
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const colorClass = activityColors[activity.type];
              
              return (
                <Link
                  key={activity.id}
                  to={`/issues/${activity.issue_id}`}
                  className="relative flex items-start gap-4 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
