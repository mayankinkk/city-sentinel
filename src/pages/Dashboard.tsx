import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AdminInviteManager } from '@/components/admin/AdminInviteManager';
import { BulkActionsManager } from '@/components/dashboard/BulkActionsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { issueTypeLabels, IssueType, IssueStatus } from '@/types/issue';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Clock, Loader2, CheckCircle, AlertTriangle, TrendingUp, MapPin, Users, Edit } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
};

export default function Dashboard() {
  const { data: issues, isLoading } = useIssues();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Calculate statistics
  const totalIssues = issues?.length || 0;
  const pendingCount = issues?.filter(i => i.status === 'pending').length || 0;
  const inProgressCount = issues?.filter(i => i.status === 'in_progress').length || 0;
  const resolvedCount = issues?.filter(i => i.status === 'resolved').length || 0;
  const highPriorityCount = issues?.filter(i => i.priority === 'high' && i.status !== 'resolved').length || 0;

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

  // Resolution rate
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

  // Average resolution time (mock for now)
  const avgResolutionDays = issues?.filter(i => i.resolved_at).reduce((acc, issue) => {
    const created = new Date(issue.created_at);
    const resolved = new Date(issue.resolved_at!);
    return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  }, 0) || 0;
  const avgDays = issues?.filter(i => i.resolved_at).length 
    ? Math.round(avgResolutionDays / issues.filter(i => i.resolved_at).length) 
    : 0;

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - CityFix</title>
        <meta name="description" content="CityFix admin dashboard. View analytics, manage issues, and track resolution progress." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage issues, invites, and view analytics
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Edit className="h-4 w-4" />
              Bulk Actions
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <Users className="h-4 w-4" />
              Admin Invites
            </TabsTrigger>
          </TabsList>

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
                      <Loader2 className="h-6 w-6 text-status-in-progress" />
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

          <TabsContent value="bulk">
            <BulkActionsManager />
          </TabsContent>

          <TabsContent value="invites">
            <AdminInviteManager />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
