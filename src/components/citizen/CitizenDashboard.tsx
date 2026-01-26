import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useUserIssues } from '@/hooks/useProfile';
import { useFollowedIssues } from '@/hooks/useFollows';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { IssueCard } from '@/components/issues/IssueCard';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Heart, 
  TrendingUp,
  ArrowRight,
  Plus,
  Loader2
} from 'lucide-react';

export function CitizenDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: userIssues, isLoading: issuesLoading } = useUserIssues();
  const { data: followedIssues, isLoading: followsLoading } = useFollowedIssues();

  const stats = {
    total: userIssues?.length || 0,
    resolved: userIssues?.filter(i => i.status === 'resolved').length || 0,
    pending: userIssues?.filter(i => i.status === 'pending').length || 0,
    inProgress: userIssues?.filter(i => i.status === 'in_progress').length || 0,
    following: followedIssues?.length || 0,
  };

  const resolutionRate = stats.total > 0 
    ? Math.round((stats.resolved / stats.total) * 100) 
    : 0;

  // Get recent issues (last 5)
  const recentIssues = userIssues?.slice(0, 5) || [];

  if (issuesLoading || followsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('citizenDashboard.title')}</h1>
          <p className="text-muted-foreground">{t('citizenDashboard.subtitle')}</p>
        </div>
        <Link to="/report">
          <Button variant="hero" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('nav.reportIssue')}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('citizenDashboard.totalReported')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{t('citizenDashboard.totalReportedDesc')}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-resolved">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('citizenDashboard.resolvedIssues')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-status-resolved">{stats.resolved}</p>
            <p className="text-xs text-muted-foreground">{t('citizenDashboard.resolvedIssuesDesc')}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-pending">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('citizenDashboard.pendingIssues')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-status-pending">{stats.pending + stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">{t('citizenDashboard.pendingIssuesDesc')}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {t('citizenDashboard.following')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.following}</p>
            <p className="text-xs text-muted-foreground">{t('citizenDashboard.followingDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('citizenDashboard.resolutionRate')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {stats.resolved} / {stats.total} issues resolved
            </span>
            <span className="text-2xl font-bold text-primary">{resolutionRate}%</span>
          </div>
          <Progress value={resolutionRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t('citizenDashboard.recentActivity')}</CardTitle>
            <CardDescription>Your latest reported issues</CardDescription>
          </div>
          {recentIssues.length > 0 && (
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-1">
                {t('citizenDashboard.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {recentIssues.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentIssues.map((issue: any) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('citizenDashboard.noActivity')}</p>
              <Link to="/report">
                <Button variant="hero" size="sm" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  {t('nav.reportIssue')}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
