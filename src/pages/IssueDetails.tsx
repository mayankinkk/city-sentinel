import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIssue, useUpdateIssue, useDeleteIssue } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/issues/StatusBadge';
import { PriorityBadge } from '@/components/issues/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueTypeLabels, issueTypeIcons, statusLabels, IssueStatus } from '@/types/issue';
import { format } from 'date-fns';
import { MapPin, Calendar, ArrowLeft, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

export default function IssueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: issue, isLoading, error } = useIssue(id || '');
  const { user, isAdmin } = useAuth();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

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
        <title>{issue.title} - CityFix</title>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Actions */}
            {canModify && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
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

                  {isAdmin && (
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
                  )}
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
