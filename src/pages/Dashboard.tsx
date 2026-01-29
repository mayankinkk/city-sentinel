import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RoleBadge } from '@/components/dashboard/RoleBadge';
import { IssuesByTypeChart } from '@/components/dashboard/IssuesByTypeChart';
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { VerificationOverview } from '@/components/dashboard/VerificationOverview';
import { AdminInviteManager } from '@/components/admin/AdminInviteManager';
import { DepartmentManager } from '@/components/admin/DepartmentManager';
import { BulkActionsManager } from '@/components/dashboard/BulkActionsManager';
import { NewReportsPanel } from '@/components/dashboard/NewReportsPanel';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Edit,
  ShieldCheck,
  Users,
  Building2,
  Bell,
  LayoutDashboard
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Dashboard() {
  const { data: issues, isLoading } = useIssues();
  const { userRoles, loading } = useAuth();
  const stats = useDashboardStats(issues);
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

  // Determine which tabs to show based on role
  const showVerification = userRoles.canVerifyIssues;
  const showBulkActions = userRoles.canUpdateStatus;
  const showInvites = userRoles.canManageAdmins;
  const showDepartments = userRoles.isSuperAdmin || userRoles.isAdmin;

  return (
    <>
      <Helmet>
        <title>Dashboard - City Sentinel</title>
        <meta name="description" content="City Sentinel dashboard. View analytics, manage issues, and track resolution progress." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-in fade-in-50 slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-0.5">
                  Manage issues and view analytics
                </p>
              </div>
            </div>
            <RoleBadge userRoles={userRoles} />
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1 bg-muted/50">
            {showVerification && (
              <TabsTrigger value="new-reports" className="gap-2 data-[state=active]:bg-background">
                <Bell className="h-4 w-4" />
                New Reports
                {stats.pendingVerificationCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs animate-pulse">
                    {stats.pendingVerificationCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="analytics" className="data-[state=active]:bg-background">
              Analytics
            </TabsTrigger>
            {showVerification && (
              <TabsTrigger value="verification" className="gap-2 data-[state=active]:bg-background">
                <ShieldCheck className="h-4 w-4" />
                Verification
              </TabsTrigger>
            )}
            {showBulkActions && (
              <TabsTrigger value="bulk" className="gap-2 data-[state=active]:bg-background">
                <Edit className="h-4 w-4" />
                Bulk Actions
              </TabsTrigger>
            )}
            {showDepartments && (
              <TabsTrigger value="departments" className="gap-2 data-[state=active]:bg-background">
                <Building2 className="h-4 w-4" />
                Departments
              </TabsTrigger>
            )}
            {showInvites && (
              <TabsTrigger value="invites" className="gap-2 data-[state=active]:bg-background">
                <Users className="h-4 w-4" />
                Admin Invites
              </TabsTrigger>
            )}
          </TabsList>

          {showVerification && (
            <TabsContent value="new-reports" className="animate-in fade-in-50 duration-300">
              <NewReportsPanel />
            </TabsContent>
          )}

          <TabsContent value="analytics" className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Stats Grid */}
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Issues"
                value={stats.totalIssues}
                icon={FileText}
                variant="primary"
              />
              <StatsCard
                title="Pending Review"
                value={stats.pendingCount}
                icon={Clock}
                variant="warning"
              />
              <StatsCard
                title="High Priority"
                value={stats.highPriorityCount}
                icon={AlertTriangle}
                variant="default"
              />
              <StatsCard
                title="Resolved"
                value={stats.resolvedCount}
                icon={CheckCircle}
                variant="success"
              />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <IssuesByTypeChart data={stats.issuesByType} />
              <StatusDistributionChart data={stats.statusData} />
            </div>

            {/* Performance Metrics */}
            <PerformanceMetrics 
              resolutionRate={stats.resolutionRate}
              avgResolutionDays={stats.avgResolutionDays}
              inProgressCount={stats.inProgressCount}
            />
          </TabsContent>

          {showVerification && (
            <TabsContent value="verification" className="animate-in fade-in-50 duration-300">
              <VerificationOverview 
                pendingCount={stats.pendingVerificationCount}
                verifiedCount={stats.verifiedCount}
                invalidCount={stats.invalidCount}
                spamCount={stats.spamCount}
                chartData={stats.verificationData}
              />
            </TabsContent>
          )}

          {showBulkActions && (
            <TabsContent value="bulk" className="animate-in fade-in-50 duration-300">
              <BulkActionsManager />
            </TabsContent>
          )}

          {showDepartments && (
            <TabsContent value="departments" className="animate-in fade-in-50 duration-300">
              <DepartmentManager />
            </TabsContent>
          )}

          {showInvites && (
            <TabsContent value="invites" className="animate-in fade-in-50 duration-300">
              <AdminInviteManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
