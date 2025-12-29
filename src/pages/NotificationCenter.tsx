import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.issue_id) {
      navigate(`/issues/${notification.issue_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                  !notification.is_read ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      !notification.is_read ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Bell className={`h-4 w-4 ${
                        !notification.is_read ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${
                          !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.issue_id && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View issue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  You'll receive notifications when there are updates to your reported issues or issues you follow.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
