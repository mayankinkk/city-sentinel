import { useState } from 'react';
import { useIssues } from '@/hooks/useIssues';
import { MapView } from '@/components/map/MapView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IssueStatus, IssuePriority, IssueType, issueTypeLabels, statusLabels, priorityLabels } from '@/types/issue';
import { Flame, Map, Filter, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function MapPage() {
  const { data: issues, isLoading } = useIssues();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');

  const filteredIssues = issues?.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && issue.issue_type !== typeFilter) return false;
    return true;
  }) || [];

  return (
    <>
      <Helmet>
        <title>Issues Map - City Sentinel</title>
        <meta name="description" content="View all reported city issues on an interactive map. See potholes, broken lights, and other infrastructure problems in your area." />
      </Helmet>

      <div className="h-[calc(100vh-4rem)] relative">
        {/* Controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-2">
          <Card className="p-2 flex items-center gap-2 bg-background/95 backdrop-blur">
            <Filter className="h-4 w-4 text-muted-foreground ml-2" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IssueStatus | 'all')}>
              <SelectTrigger className="w-[130px] border-0 bg-transparent">
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
              <SelectTrigger className="w-[130px] border-0 bg-transparent">
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
              <SelectTrigger className="w-[140px] border-0 bg-transparent">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(issueTypeLabels) as IssueType[]).map((type) => (
                  <SelectItem key={type} value={type}>{issueTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-1 bg-background/95 backdrop-blur">
            <div className="flex gap-1">
              <Button
                variant={showHeatmap ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowHeatmap(false)}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                Markers
              </Button>
              <Button
                variant={showHeatmap ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => setShowHeatmap(true)}
                className="gap-2"
              >
                <Flame className="h-4 w-4" />
                Heatmap
              </Button>
            </div>
          </Card>
        </div>

        {/* Stats Badge */}
        <Card className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-background/95 backdrop-blur">
          <p className="text-sm font-medium">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <span>{filteredIssues.length} issues shown</span>
            )}
          </p>
        </Card>

        {/* Map */}
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <MapView 
            issues={filteredIssues} 
            showHeatmap={showHeatmap}
          />
        )}
      </div>
    </>
  );
}
