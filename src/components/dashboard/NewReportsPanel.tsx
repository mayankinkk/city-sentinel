import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '@/hooks/useIssues';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { issueTypeLabels, IssueType } from '@/types/issue';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  MapPin, 
  Clock, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewReportsPanel() {
  const { data: issues, isLoading } = useIssues();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  // Filter for newly reported issues (pending verification)
  const newReports = issues?.filter(issue => {
    const isPendingVerification = !issue.verification_status || issue.verification_status === 'pending_verification';
    
    if (!isPendingVerification) return false;
    
    const createdAt = new Date(issue.created_at);
    const now = new Date();
    
    if (filter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return createdAt >= today;
    }
    
    if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return createdAt >= weekAgo;
    }
    
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  const todayCount = issues?.filter(issue => {
    const isPendingVerification = !issue.verification_status || issue.verification_status === 'pending_verification';
    if (!isPendingVerification) return false;
    const createdAt = new Date(issue.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return createdAt >= today;
  }).length || 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading reports...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <Bell className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{newReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reported Today</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">
                  {newReports.filter(r => r.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                New Issue Reports
              </CardTitle>
              <CardDescription>
                Issues awaiting verification from citizens
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: 'all' | 'today' | 'week') => setFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pending</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {newReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">All caught up!</h3>
              <p className="text-muted-foreground">No new reports waiting for verification.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {newReports.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/issues/${issue.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {issueTypeLabels[issue.issue_type as IssueType]}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                          </Badge>
                        </div>
                        <h4 className="font-medium truncate">{issue.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {issue.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {issue.address.length > 30 
                                ? issue.address.substring(0, 30) + '...' 
                                : issue.address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {issue.image_url && (
                        <img 
                          src={issue.image_url} 
                          alt="Issue" 
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Review & Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
