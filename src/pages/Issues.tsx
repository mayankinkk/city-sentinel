import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIssues } from '@/hooks/useIssues';
import { IssueCard } from '@/components/issues/IssueCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IssueStatus, IssuePriority, IssueType, issueTypeLabels, statusLabels, priorityLabels } from '@/types/issue';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Search, Filter, Loader2, FileX } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Issues() {
  const { data: issues, isLoading } = useIssues();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');

  const filteredIssues = issues?.filter((issue) => {
    if (search && !issue.title.toLowerCase().includes(search.toLowerCase()) && 
        !issue.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && issue.issue_type !== typeFilter) return false;
    return true;
  }) || [];

  return (
    <>
      <Helmet>
        <title>All Issues - CityFix</title>
        <meta name="description" content="Browse all reported city infrastructure issues. Filter by status, priority, and type to find problems in your area." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reported Issues</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? 'Loading...' : `${issues?.length || 0} total issues reported`}
            </p>
          </div>
          {user && (
            <Link to="/report">
              <Button variant="hero" className="gap-2">
                <Plus className="h-4 w-4" />
                Report Issue
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IssueStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {(Object.keys(statusLabels) as IssueStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as IssuePriority | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {(Object.keys(priorityLabels) as IssuePriority[]).map((priority) => (
                  <SelectItem key={priority} value={priority}>{priorityLabels[priority]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as IssueType | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(issueTypeLabels) as IssueType[]).map((type) => (
                  <SelectItem key={type} value={type}>{issueTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Issues Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileX className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No issues found</h3>
            <p className="text-muted-foreground mb-6">
              {search || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to report an issue!'}
            </p>
            {user && (
              <Link to="/report">
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Report Issue
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
