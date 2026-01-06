import { Issue, issueTypeLabels, issueTypeIcons } from '@/types/issue';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { VerificationBadge } from './VerificationBadge';
import { MapPin, Calendar, ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link to={`/issues/${issue.id}`}>
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
        {issue.image_url && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={issue.image_url}
              alt={issue.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{issueTypeIcons[issue.issue_type]}</span>
              <div>
                <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {issue.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {issueTypeLabels[issue.issue_type]}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {issue.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issue.verification_status && issue.verification_status !== 'pending_verification' && (
              <VerificationBadge 
                status={issue.verification_status} 
                verifiedBy={issue.verified_by}
                verifiedAt={issue.verified_at}
              />
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
            {issue.address && (
              <div className="flex items-center gap-1 truncate flex-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{issue.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
