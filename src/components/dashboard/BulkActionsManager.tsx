import { useState } from 'react';
import { useIssues, useUpdateIssue } from '@/hooks/useIssues';
import { IssueStatus, statusLabels, priorityLabels, issueTypeLabels } from '@/types/issue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/issues/StatusBadge';
import { PriorityBadge } from '@/components/issues/PriorityBadge';
import { toast } from 'sonner';
import { Loader2, CheckSquare, Square, ArrowRight } from 'lucide-react';

export function BulkActionsManager() {
  const { data: issues, isLoading } = useIssues();
  const updateIssue = useUpdateIssue();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newStatus, setNewStatus] = useState<IssueStatus | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const activeIssues = issues?.filter(i => i.status !== 'resolved' && i.status !== 'withdrawn') || [];

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === activeIssues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeIssues.map(i => i.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!newStatus || selectedIds.size === 0) {
      toast.error('Please select issues and a new status');
      return;
    }

    setIsUpdating(true);
    try {
      const promises = Array.from(selectedIds).map(id => {
        return updateIssue.mutateAsync({
          id,
          status: newStatus,
        });
      });

      await Promise.all(promises);
      toast.success(`Updated ${selectedIds.size} issues to ${statusLabels[newStatus]}`);
      setSelectedIds(new Set());
      setNewStatus('');
    } catch (error) {
      toast.error('Failed to update some issues');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Status Update</CardTitle>
        <CardDescription>
          Select multiple issues and update their status at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Action Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="gap-2"
          >
            {selectedIds.size === activeIssues.length && activeIssues.length > 0 ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selectedIds.size === activeIssues.length && activeIssues.length > 0 
              ? 'Deselect All' 
              : 'Select All'}
          </Button>

          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as IssueStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="New status..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(statusLabels) as IssueStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="hero"
              size="sm"
              onClick={handleBulkUpdate}
              disabled={selectedIds.size === 0 || !newStatus || isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Update
            </Button>
          </div>
        </div>

        {/* Issues List */}
        {activeIssues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active issues to manage
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border">
            {activeIssues.map((issue) => (
              <div
                key={issue.id}
                className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                  selectedIds.has(issue.id) ? 'bg-primary/5' : ''
                }`}
                onClick={() => toggleSelect(issue.id)}
              >
                <Checkbox
                  checked={selectedIds.has(issue.id)}
                  onCheckedChange={() => toggleSelect(issue.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{issue.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {issueTypeLabels[issue.issue_type]}
                    {issue.address && ` • ${issue.address}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
