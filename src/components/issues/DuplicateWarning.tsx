import { Link } from 'react-router-dom';
import { NearbyIssue } from '@/hooks/useDuplicateDetection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Loader2 } from 'lucide-react';
import { issueTypeLabels } from '@/types/issue';
import { IssueType } from '@/types/issue';

interface DuplicateWarningProps {
  nearbyIssues: NearbyIssue[];
  isChecking: boolean;
}

export function DuplicateWarning({ nearbyIssues, isChecking }: DuplicateWarningProps) {
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking for similar reports nearby...
      </div>
    );
  }

  if (nearbyIssues.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          Potential Duplicates Found ({nearbyIssues.length})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Similar issues were found nearby. Please check if your issue has already been reported.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {nearbyIssues.slice(0, 5).map((issue) => (
          <Link 
            key={issue.id} 
            to={`/issues/${issue.id}`}
            target="_blank"
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{issue.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {issueTypeLabels[issue.issue_type as IssueType] || issue.issue_type}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {(issue.distance_km * 1000).toFixed(0)}m away
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
