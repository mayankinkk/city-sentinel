import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIssue, useUpdateIssue, useDeleteIssue } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/issues/StatusBadge';
import { PriorityBadge } from '@/components/issues/PriorityBadge';
import { IssueActions } from '@/components/issues/IssueActions';
import { CommentsSection } from '@/components/issues/CommentsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueTypeLabels, issueTypeIcons, statusLabels, IssueStatus } from '@/types/issue';
import { format } from 'date-fns';
import { MapPin, Calendar, ArrowLeft, Loader2, Trash2, ExternalLink, Bell } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function IssueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: issue, isLoading, error } = useIssue(id || '');
  const { user, isAdmin } = useAuth();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const handleTestNotification = async () => {
    if (!user || !issue) return;
    
    setIsTestingNotification(true);
    try {
      const { error } = await supabase.functions.invoke('notify-status-change', {
        body: {
          issue_id: issue.id,
          old_status: 'pending',
          new_status: 'in_progress',
        },
      });

      if (error) {
        console.error('Test notification failed:', error);
        toast.error('Failed to send test notification: ' + error.message);
      } else {
        toast.success('Test notification sent! Check your notifications.');
      }
    } catch (err) {
      console.error('Test notification error:', err);
      toast.error('Failed to send test notification');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;
    
    await updateIssue.mutateAsync({
      id: issue.id,
      status: newStatus,
      resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
    });
  };

  const handleDelete = async () => {
    if (!issue || !confirm('Are you sure you want to delete this issue?')) return;
    
    await deleteIssue.mutateAsync(issue.id);
    navigate('/issues');
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Issue not found</h1>
          <Link to="/issues">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Issues
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === issue.reporter_id;
  const canModify = isOwner || isAdmin;

  return (
    <>
      <Helmet>
        <title>{issue.title} - City Sentinel</title>
        <meta name="description" content={issue.description.substring(0, 160)} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Link to="/issues" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Issues
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{issueTypeIcons[issue.issue_type]}</span>
                <div>
                  <p className="text-sm text-muted-foreground">{issueTypeLabels[issue.issue_type]}</p>
                  <h1 className="text-2xl md:text-3xl font-bold">{issue.title}</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
              </div>
            </div>

            {/* Image */}
            {issue.image_url && (
              <Card className="overflow-hidden">
                <img
                  src={issue.image_url}
                  alt={issue.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{issue.description}</p>
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {issue.address || `${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}`}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open in Google Maps
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <CommentsSection issueId={issue.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upvote and Follow Actions */}
            <IssueActions issueId={issue.id} />

            {/* Reporter Actions - Withdraw */}
            {isOwner && issue.status !== 'withdrawn' && issue.status !== 'resolved' && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleStatusChange('withdrawn')}
                    disabled={updateIssue.isPending}
                  >
                    {updateIssue.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Withdraw Issue
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Withdraw if the issue was resolved or reported in error.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Authority Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Update Status</label>
                    <Select
                      value={issue.status}
                      onValueChange={(value) => handleStatusChange(value as IssueStatus)}
                      disabled={updateIssue.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusLabels) as IssueStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={handleDelete}
                    disabled={deleteIssue.isPending}
                  >
                    {deleteIssue.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete Issue
                  </Button>

                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Debug Tools</p>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleTestNotification}
                      disabled={isTestingNotification}
                    >
                      {isTestingNotification ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      Test Notification
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sends a sample notification to verify the notification system.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reported:</span>
                  <span>{format(new Date(issue.created_at), 'PPP')}</span>
                </div>
                
                {issue.resolved_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-status-resolved" />
                    <span className="text-muted-foreground">Resolved:</span>
                    <span>{format(new Date(issue.resolved_at), 'PPP')}</span>
                  </div>
                )}

                {issue.reporter_email && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Reported by:</span>
                    <span className="ml-2">{issue.reporter_email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
