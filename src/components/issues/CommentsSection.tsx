import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Loader2, MessageSquare, Send, Trash2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  issueId: string;
}

export function CommentsSection({ issueId }: CommentsSectionProps) {
  const { user, isAdmin } = useAuth();
  const { data: comments, isLoading } = useComments(issueId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [content, setContent] = useState('');
  const [isAdminUpdate, setIsAdminUpdate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addComment.mutateAsync({
      issueId,
      content: content.trim(),
      isAdminUpdate: isAdmin && isAdminUpdate,
    });
    setContent('');
    setIsAdminUpdate(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {comments.map((comment) => {
              const profile = comment.profile as any;
              const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';
              const isOwn = user?.id === comment.user_id;

              return (
                <div
                  key={comment.id}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg",
                    comment.is_admin_update 
                      ? "bg-primary/5 border border-primary/20" 
                      : "bg-muted/50"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className={cn(
                      "text-xs",
                      comment.is_admin_update && "gradient-hero text-primary-foreground"
                    )}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {profile?.full_name || 'Anonymous'}
                      </span>
                      {comment.is_admin_update && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Shield className="h-3 w-3" />
                          Official Update
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  {(isOwn || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteComment.mutate({ commentId: comment.id, issueId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        )}

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
            <Textarea
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="admin-update"
                  checked={isAdminUpdate}
                  onCheckedChange={(checked) => setIsAdminUpdate(!!checked)}
                />
                <Label htmlFor="admin-update" className="text-sm cursor-pointer">
                  Mark as official status update
                </Label>
              </div>
            )}
            <Button
              type="submit"
              disabled={!content.trim() || addComment.isPending}
              className="gap-2"
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </Button>
          </form>
        ) : (
          <p className="text-center py-4 text-muted-foreground border-t pt-4">
            Sign in to join the discussion
          </p>
        )}
      </CardContent>
    </Card>
  );
}
