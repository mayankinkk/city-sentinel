import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIssue, useUpdateIssue, useDeleteIssue, useVerifyIssue } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAddVerificationHistory } from '@/hooks/useVerificationHistory';
import { StatusBadge } from '@/components/issues/StatusBadge';
import { PriorityBadge } from '@/components/issues/PriorityBadge';
import { VerificationBadge } from '@/components/issues/VerificationBadge';
import { IssueActions } from '@/components/issues/IssueActions';
import { CommentsSection } from '@/components/issues/CommentsSection';
import { BeforeAfterSlider } from '@/components/issues/BeforeAfterSlider';
import { ReporterInfo } from '@/components/issues/ReporterInfo';
import { VerifierInfo } from '@/components/issues/VerifierInfo';
import { VerificationHistory } from '@/components/issues/VerificationHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  issueTypeLabels, 
  issueTypeIcons, 
  statusLabels, 
  IssueStatus, 
  VerificationStatus,
  verificationStatusLabels,
  priorityLabels,
  IssuePriority
} from '@/types/issue';
import { format } from 'date-fns';
import { 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  ExternalLink, 
  Bell, 
  Upload, 
  Image,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Crown,
  UserCog,
  Eye,
  AlertTriangle,
  History,
  ChevronDown
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function IssueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: issue, isLoading, error } = useIssue(id || '');
  const { user, userRoles } = useAuth();
  const { data: profile } = useProfile();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const verifyIssue = useVerifyIssue();
  const addVerificationHistory = useAddVerificationHistory();
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [isUploadingResolvedImage, setIsUploadingResolvedImage] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const resolvedImageInputRef = useRef<HTMLInputElement>(null);

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

  const handleResolvedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !issue) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingResolvedImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${issue.id}-resolved-${Date.now()}.${fileExt}`;
      const filePath = `resolved/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('issue-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('issue-images')
        .getPublicUrl(filePath);

      await updateIssue.mutateAsync({
        id: issue.id,
        resolved_image_url: publicUrl,
      });

      toast.success('Resolved image uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload resolved image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingResolvedImage(false);
      if (resolvedImageInputRef.current) {
        resolvedImageInputRef.current.value = '';
      }
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

  const handleVerification = async (status: VerificationStatus) => {
    if (!issue || !user) return;
    
    // Determine verifier role for history
    let verifierRole = 'user';
    if (userRoles.isSuperAdmin) verifierRole = 'Super Admin';
    else if (userRoles.isAdmin) verifierRole = 'Admin';
    else if (userRoles.isDepartmentAdmin) verifierRole = 'Authority';
    else if (userRoles.isModerator) verifierRole = 'Moderator';
    
    const oldStatus = issue.verification_status;
    
    await verifyIssue.mutateAsync({
      id: issue.id,
      verification_status: status,
      verified_by: user.id,
      verification_notes: verificationNotes || undefined,
    });
    
    // Add to verification history
    await addVerificationHistory.mutateAsync({
      issue_id: issue.id,
      verification_status: status,
      verified_by: user.id,
      verifier_name: profile?.full_name || undefined,
      verifier_role: verifierRole,
      verification_notes: verificationNotes || undefined,
    });
    
    // Send verification change notifications
    try {
      await supabase.functions.invoke('notify-verification-change', {
        body: {
          issue_id: issue.id,
          old_status: oldStatus,
          new_status: status,
          verifier_name: profile?.full_name || null,
          verifier_role: verifierRole,
        },
      });
    } catch (err) {
      console.error('Failed to send verification notification:', err);
    }
    
    setVerificationNotes('');
  };

  const handlePriorityChange = async (newPriority: IssuePriority) => {
    if (!issue) return;
    
    await updateIssue.mutateAsync({
      id: issue.id,
      priority: newPriority,
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

  // User must be logged in AND their ID must match the reporter_id
  const isOwner = user && issue.reporter_id && user.id === issue.reporter_id;

  // Role-based permission helpers
  const getRoleBadge = () => {
    if (userRoles.isSuperAdmin) return { label: 'Super Admin', icon: Crown, color: 'bg-purple-500/10 text-purple-600' };
    if (userRoles.isAdmin) return { label: 'Admin', icon: UserCog, color: 'bg-blue-500/10 text-blue-600' };
    if (userRoles.isDepartmentAdmin) return { label: 'Authority', icon: UserCog, color: 'bg-green-500/10 text-green-600' };
    if (userRoles.isModerator) return { label: 'Moderator', icon: Eye, color: 'bg-orange-500/10 text-orange-600' };
    return null;
  };

  const roleBadge = getRoleBadge();

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
                {issue.verification_status && (
                  <VerificationBadge 
                    status={issue.verification_status} 
                    verifiedBy={issue.verified_by}
                    verifiedAt={issue.verified_at}
                  />
                )}
              </div>
            </div>

            {/* Before/After Comparison Slider */}
            {issue.image_url && issue.resolved_image_url && (
              <BeforeAfterSlider
                beforeImage={issue.image_url}
                afterImage={issue.resolved_image_url}
                beforeLabel="Before"
                afterLabel="Resolved"
              />
            )}

            {/* Issue Image (only shown if no comparison available) */}
            {issue.image_url && !issue.resolved_image_url && (
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Reported Issue</CardTitle>
                </CardHeader>
                <img
                  src={issue.image_url}
                  alt={issue.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              </Card>
            )}

            {/* Resolved Image Only (if no before image) */}
            {!issue.image_url && issue.resolved_image_url && (
              <Card className="overflow-hidden border-status-resolved/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-status-resolved flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Resolution Proof
                  </CardTitle>
                </CardHeader>
                <img
                  src={issue.resolved_image_url}
                  alt="Resolved issue"
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

            {/* Verification Info (if verified) */}
            {issue.verified_by && (
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-orange-500" />
                    Verification Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {issue.verification_notes && (
                    <p className="text-sm text-muted-foreground">{issue.verification_notes}</p>
                  )}
                  <VerifierInfo 
                    verifiedBy={issue.verified_by} 
                    verifiedAt={issue.verified_at} 
                  />
                  
                  {/* Verification History */}
                  <Collapsible open={showHistory} onOpenChange={setShowHistory} className="mt-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Verification History
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <VerificationHistory issueId={issue.id} />
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )}

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
            {/* Role Indicator */}
            {roleBadge && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <roleBadge.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">Viewing as {roleBadge.label}</span>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Moderator Actions - Verification */}
            {userRoles.canVerifyIssues && (
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-orange-500" />
                    Verification
                  </CardTitle>
                  <CardDescription>
                    Verify the authenticity and set severity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Current Status</label>
                    <div className="mb-3">
                      {issue.verification_status ? (
                        <VerificationBadge status={issue.verification_status} />
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                          Pending Verification
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Priority/Severity Setting */}
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Set Severity
                    </label>
                    <Select
                      value={issue.priority}
                      onValueChange={(value) => handlePriorityChange(value as IssuePriority)}
                      disabled={updateIssue.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(priorityLabels) as IssuePriority[]).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priorityLabels[priority]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assign severity based on impact and urgency
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Add verification notes..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="mb-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-1 border-green-500/30 hover:bg-green-500/10 text-green-600"
                      onClick={() => handleVerification('verified')}
                      disabled={verifyIssue.isPending}
                    >
                      {verifyIssue.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Verified
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1 border-red-500/30 hover:bg-red-500/10 text-red-600"
                      onClick={() => handleVerification('invalid')}
                      disabled={verifyIssue.isPending}
                    >
                      {verifyIssue.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldX className="h-4 w-4" />
                      )}
                      Invalid
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-1 border-gray-500/30 hover:bg-gray-500/10 text-gray-600"
                    onClick={() => handleVerification('spam')}
                    disabled={verifyIssue.isPending}
                  >
                    {verifyIssue.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="h-4 w-4" />
                    )}
                    Mark as Spam
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Authority Actions - Status Update */}
            {userRoles.canUpdateStatus && (
              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-green-500" />
                    Authority Actions
                  </CardTitle>
                  <CardDescription>
                    Update issue status and manage resolution
                  </CardDescription>
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

                  {/* Resolved Image Upload */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Upload Resolution Proof
                    </label>
                    <input
                      ref={resolvedImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleResolvedImageUpload}
                      className="hidden"
                      disabled={isUploadingResolvedImage}
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => resolvedImageInputRef.current?.click()}
                      disabled={isUploadingResolvedImage}
                    >
                      {isUploadingResolvedImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {issue.resolved_image_url ? 'Replace Image' : 'Upload Image'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload a photo showing the resolved issue.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Super Admin / Admin Actions - Delete */}
            {userRoles.canDeleteIssues && (
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Crown className="h-5 w-5" />
                    Admin Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="border-t pt-4">
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

                <ReporterInfo reporterEmail={issue.reporter_email} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
