import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIssues } from '@/hooks/useIssues';
import { IssueCard } from '@/components/issues/IssueCard';
import { AdvancedFilters } from '@/components/issues/AdvancedFilters';
import { ExportReports } from '@/components/issues/ExportReports';
import { IssueGridSkeleton } from '@/components/ui/skeleton-loaders';
import { Button } from '@/components/ui/button';
import { IssueStatus, IssuePriority, IssueType } from '@/types/issue';
import { useAuth } from '@/hooks/useAuth';
import { Plus, FileX } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Issues() {
  const { data: issues, isLoading } = useIssues();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filteredIssues = issues?.filter((issue) => {
    if (search && !issue.title.toLowerCase().includes(search.toLowerCase()) && 
        !issue.description.toLowerCase().includes(search.toLowerCase()) &&
        !issue.address?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && issue.issue_type !== typeFilter) return false;
    if (departmentFilter !== 'all' && issue.department_id !== departmentFilter) return false;
    
    if (dateFrom) {
      const issueDate = new Date(issue.created_at);
      if (issueDate < dateFrom) return false;
    }
    if (dateTo) {
      const issueDate = new Date(issue.created_at);
      if (issueDate > dateTo) return false;
    }
    
    return true;
  }) || [];

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setDepartmentFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <>
      <Helmet>
        <title>All Issues - City Sentinel</title>
        <meta name="description" content="Browse all reported city infrastructure issues. Filter by status, priority, and type to find problems in your area." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reported Issues</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? 'Loading...' : `${filteredIssues.length} issues found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && filteredIssues.length > 0 && (
              <ExportReports issues={filteredIssues} />
            )}
            {user && (
              <Link to="/report">
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Report Issue
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mb-8">
          <AdvancedFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Issues Grid */}
        {isLoading ? (
          <IssueGridSkeleton count={6} />
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileX className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No issues found</h3>
            <p className="text-muted-foreground mb-6">
              {search || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo
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
