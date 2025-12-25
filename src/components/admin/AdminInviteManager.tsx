import { useState } from 'react';
import { useAdminInvites, useCreateAdminInvite, useDeleteAdminInvite } from '@/hooks/useAdminInvites';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Copy, Trash2, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

export function AdminInviteManager() {
  const { data: invites, isLoading } = useAdminInvites();
  const createInvite = useCreateAdminInvite();
  const deleteInvite = useDeleteAdminInvite();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleCreateInvite = async () => {
    setEmailError('');
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }

    const token = await createInvite.mutateAsync(email);
    if (token) {
      const inviteUrl = `${window.location.origin}/authority?token=${token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied to clipboard!');
      setEmail('');
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/authority?token=${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite New Authority
        </CardTitle>
        <CardDescription>
          Send invites to new administrators. Only invited users can create authority accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Invite Form */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="invite-email" className="sr-only">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateInvite()}
            />
            {emailError && (
              <p className="text-sm text-destructive mt-1">{emailError}</p>
            )}
          </div>
          <Button onClick={handleCreateInvite} disabled={createInvite.isPending}>
            {createInvite.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Send Invite</span>
          </Button>
        </div>

        {/* Invites List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : invites && invites.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date();
                  return (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        {invite.used ? (
                          <Badge variant="resolved" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Used
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="pending" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(invite.expires_at), 'PP')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!invite.used && !isExpired && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyInviteLink(invite.invite_token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInvite.mutate(invite.id)}
                            disabled={deleteInvite.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No pending invites. Create one to add new authorities.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
