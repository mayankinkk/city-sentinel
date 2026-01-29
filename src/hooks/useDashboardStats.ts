import { useMemo } from 'react';
import { Issue, issueTypeLabels, IssueType } from '@/types/issue';

export interface DashboardStats {
  // Basic counts
  totalIssues: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  highPriorityCount: number;
  
  // Verification stats
  pendingVerificationCount: number;
  verifiedCount: number;
  invalidCount: number;
  spamCount: number;
  
  // Computed metrics
  resolutionRate: number;
  avgResolutionDays: number;
  
  // Chart data
  issuesByType: { name: string; count: number }[];
  statusData: { name: string; value: number; color: string }[];
  verificationData: { name: string; value: number; color: string }[];
}

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

export function useDashboardStats(issues: Issue[] | undefined): DashboardStats {
  return useMemo(() => {
    const totalIssues = issues?.length || 0;
    const pendingCount = issues?.filter(i => i.status === 'pending').length || 0;
    const inProgressCount = issues?.filter(i => i.status === 'in_progress').length || 0;
    const resolvedCount = issues?.filter(i => i.status === 'resolved').length || 0;
    const highPriorityCount = issues?.filter(i => i.priority === 'high' && i.status !== 'resolved').length || 0;

    // Verification stats
    const pendingVerificationCount = issues?.filter(i => !i.verification_status || i.verification_status === 'pending_verification').length || 0;
    const verifiedCount = issues?.filter(i => i.verification_status === 'verified').length || 0;
    const invalidCount = issues?.filter(i => i.verification_status === 'invalid').length || 0;
    const spamCount = issues?.filter(i => i.verification_status === 'spam').length || 0;

    // Issues by type
    const issuesByType = Object.keys(issueTypeLabels)
      .map((type) => ({
        name: issueTypeLabels[type as IssueType],
        count: issues?.filter(i => i.issue_type === type).length || 0,
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

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
    const resolvedIssues = issues?.filter(i => i.resolved_at) || [];
    const totalDays = resolvedIssues.reduce((acc, issue) => {
      const created = new Date(issue.created_at);
      const resolved = new Date(issue.resolved_at!);
      return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    const avgResolutionDays = resolvedIssues.length > 0 ? Math.round(totalDays / resolvedIssues.length) : 0;

    return {
      totalIssues,
      pendingCount,
      inProgressCount,
      resolvedCount,
      highPriorityCount,
      pendingVerificationCount,
      verifiedCount,
      invalidCount,
      spamCount,
      resolutionRate,
      avgResolutionDays,
      issuesByType,
      statusData,
      verificationData,
    };
  }, [issues]);
}
