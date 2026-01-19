import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AdminInviteManager } from '@/components/admin/AdminInviteManager';
import { DepartmentManager } from '@/components/admin/DepartmentManager';
import { BulkActionsManager } from '@/components/dashboard/BulkActionsManager';
import { NewReportsPanel } from '@/components/dashboard/NewReportsPanel';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { issueTypeLabels, IssueType } from '@/types/issue';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Edit,
  ShieldCheck,
  Crown,
  UserCog,
  Eye,
  Building2,
  Bell
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
};

const VERIFICATION_COLORS = {
  pending_verification: '#f59e0b',
  verified: '#22c55e',
  invalid: '#ef4444',
  spam: '#6b7280',
};

export default function Dashboard() {
  const { data: issues, isLoading } = useIssues();
  const { isAdmin, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  // Allow access if user has any admin-related role
  const hasAccess = userRoles.isSuperAdmin || userRoles.isAdmin || userRoles.isDepartmentAdmin || userRoles.isModerator;

  useEffect(() => {
    if (!loading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, loading, navigate]);

  if (loading || isLoading) {
    return <DashboardSkeleton />;
  }

  if (!hasAccess) {
    return null;
  }

  // Get role display info
  const getRoleInfo = () => {
    if (userRoles.isSuperAdmin) return { label: 'Super Admin', icon: Crown, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', description: 'Full system access' };
    if (userRoles.isAdmin) return { label: 'Admin', icon: UserCog, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', description: 'Manage issues and users' };
    if (userRoles.isDepartmentAdmin) return { label: 'Authority Admin', icon: Building2, color: 'bg-green-500/10 text-green-600 border-green-500/20', description: 'Update issue status' };
    if (userRoles.isModerator) return { label: 'Moderator', icon: Eye, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', description: 'Verify reports' };
    return null;
  };

  const roleInfo = getRoleInfo();

  // Calculate statistics
  const totalIssues = issues?.length || 0;
  const pendingCount = issues?.filter(i => i.status === 'pending').length || 0;
  const inProgressCount = issues?.filter(i => i.status === 'in_progress').length || 0;
  const resolvedCount = issues?.filter(i => i.status === 'resolved').length || 0;
  const highPriorityCount = issues?.filter(i => i.priority === 'high' && i.status !== 'resolved').length || 0;

  // Verification stats (for moderators)
  const pendingVerificationCount = issues?.filter(i => !i.verification_status || i.verification_status === 'pending_verification').length || 0;
  const verifiedCount = issues?.filter(i => i.verification_status === 'verified').length || 0;
  const invalidCount = issues?.filter(i => i.verification_status === 'invalid').length || 0;
  const spamCount = issues?.filter(i => i.verification_status === 'spam').length || 0;

  // Issues by type
  const issuesByType = Object.keys(issueTypeLabels).map((type) => ({
    name: issueTypeLabels[type as IssueType],
    count: issues?.filter(i => i.issue_type === type).length || 0,
  })).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Pending', value: pendingCount, color: STATUS_COLORS.pending },
    { name: 'In Progress', value: inProgressCount, color: STATUS_COLORS.in_progress },
    { name: 'Resolved', value: resolvedCount, color: STATUS_COLORS.resolved },
  ].filter(item => item.value > 0);

  // Verification distribution for pie chart
  const verificationData = [
    { name: 'Pending', value: pendingVerificationCount, color: VERIFICATION_COLORS.pending_verification },
    { name: 'Verified', value: verifiedCount, color: VERIFICATION_COLORS.verified },
    { name: 'Invalid', value: invalidCount, color: VERIFICATION_COLORS.invalid },
    { name: 'Spam', value: spamCount, color: VERIFICATION_COLORS.spam },
  ].filter(item => item.value > 0);

  // Resolution rate
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

  // Average resolution time
  const avgResolutionDays = issues?.filter(i => i.resolved_at).reduce((acc, issue) => {
    const created = new Date(issue.created_at);
    const resolved = new Date(issue.resolved_at!);
    return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  }, 0) || 0;
  const avgDays = issues?.filter(i => i.resolved_at).length 
    ? Math.round(avgResolutionDays / issues.filter(i => i.resolved_at).length) 
    : 0;

  // Determine which tabs to show based on role
  const showAnalytics = true; // Everyone can see analytics
  const showBulkActions = userRoles.canUpdateStatus; // Authority and above
  const showInvites = userRoles.canManageAdmins; // Super admin only
  const showDepartments = userRoles.isSuperAdmin || userRoles.isAdmin; // Admin and above
  const showVerification = userRoles.canVerifyIssues; // Moderators and above

  return (
    <>
      <Helmet>
        <title>Dashboard - City Sentinel</title>
        <meta name="description" content="City Sentinel dashboard. View analytics, manage issues, and track resolution progress." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage issues and view analytics
              </p>
            </div>
            {roleInfo && (
              <Badge variant="outline" className={`gap-2 px-3 py-1.5 ${roleInfo.color}`}>
                <roleInfo.icon className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{roleInfo.label}</div>
                  <div className="text-xs opacity-80">{roleInfo.description}</div>
                </div>
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue={showVerification ? "new-reports" : "analytics"} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            {showVerification && (
              <TabsTrigger value="new-reports" className="gap-2">
                <Bell className="h-4 w-4" />
                New Reports
                {pendingVerificationCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {pendingVerificationCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {showVerification && (
              <TabsTrigger value="verification" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Verification
              </TabsTrigger>
            )}
            {showBulkActions && (
              <TabsTrigger value="bulk" className="gap-2">
                <Edit className="h-4 w-4" />
                Bulk Actions
              </TabsTrigger>
            )}
            {showDepartments && (
              <TabsTrigger value="departments" className="gap-2">
                <Building2 className="h-4 w-4" />
                Departments
              </TabsTrigger>
            )}
            {showInvites && (
              <TabsTrigger value="invites" className="gap-2">
                <Users className="h-4 w-4" />
                Admin Invites
              </TabsTrigger>
            )}
          </TabsList>

          {showVerification && (
            <TabsContent value="new-reports">
              <NewReportsPanel />
            </TabsContent>
          )}

          <TabsContent value="analytics" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatsCard
                title="Total Issues"
                value={totalIssues}
                icon={FileText}
                variant="primary"
              />
              <StatsCard
                title="Pending Review"
                value={pendingCount}
                icon={Clock}
                variant="warning"
              />
              <StatsCard
                title="High Priority"
                value={highPriorityCount}
                icon={AlertTriangle}
                variant="default"
              />
              <StatsCard
                title="Resolved"
                value={resolvedCount}
                icon={CheckCircle}
                variant="success"
              />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              {/* Issues by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Issues by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {issuesByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={issuesByType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Resolution Rate</p>
                      <p className="text-2xl font-bold">{resolutionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Resolution Time</p>
                      <p className="text-2xl font-bold">{avgDays} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-status-in-progress/10">
                      <Clock className="h-6 w-6 text-status-in-progress" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">{inProgressCount} issues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {showVerification && (
            <TabsContent value="verification" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-orange-500" />
                    Verification Overview
                  </CardTitle>
                  <CardDescription>
                    Review and verify the authenticity of reported issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Verification Stats */}
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{pendingVerificationCount}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-muted-foreground">Verified</p>
                      <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-muted-foreground">Invalid</p>
                      <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                      <p className="text-sm text-muted-foreground">Spam</p>
                      <p className="text-2xl font-bold text-gray-600">{spamCount}</p>
                    </div>
                  </div>

                  {/* Verification Distribution Chart */}
                  {verificationData.length > 0 && (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={verificationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {verificationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showBulkActions && (
            <TabsContent value="bulk">
              <BulkActionsManager />
            </TabsContent>
          )}

          {showDepartments && (
            <TabsContent value="departments">
              <DepartmentManager />
            </TabsContent>
          )}

          {showInvites && (
            <TabsContent value="invites">
              <AdminInviteManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
