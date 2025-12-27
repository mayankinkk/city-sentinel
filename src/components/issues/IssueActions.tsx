import { useAuth } from '@/hooks/useAuth';
import { useUpvoteCount, useHasUpvoted, useToggleUpvote } from '@/hooks/useUpvotes';
import { useIsFollowing, useToggleFollow } from '@/hooks/useFollows';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Bell, BellOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueActionsProps {
  issueId: string;
}

export function IssueActions({ issueId }: IssueActionsProps) {
  const { user } = useAuth();
  const { data: upvoteCount } = useUpvoteCount(issueId);
  const { data: hasUpvoted } = useHasUpvoted(issueId);
  const { data: isFollowing } = useIsFollowing(issueId);
  const toggleUpvote = useToggleUpvote();
  const toggleFollow = useToggleFollow();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={hasUpvoted ? 'default' : 'outline'}
        size="sm"
        className={cn("gap-2", hasUpvoted && "bg-primary")}
        onClick={() => toggleUpvote.mutate(issueId)}
        disabled={!user || toggleUpvote.isPending}
      >
        {toggleUpvote.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className={cn("h-4 w-4", hasUpvoted && "fill-current")} />
        )}
        <span>{upvoteCount || 0}</span>
      </Button>

      <Button
        variant={isFollowing ? 'default' : 'outline'}
        size="sm"
        className="gap-2"
        onClick={() => toggleFollow.mutate(issueId)}
        disabled={!user || toggleFollow.isPending}
      >
        {toggleFollow.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <BellOff className="h-4 w-4" />
            <span className="hidden sm:inline">Following</span>
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Follow</span>
          </>
        )}
      </Button>
    </div>
  );
}
