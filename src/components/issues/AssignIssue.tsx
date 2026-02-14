import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useUpdateIssue } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AssignIssueProps {
  issueId: string;
  issueTitle: string;
  currentAssignee?: string;
}

export function AssignIssue({ issueId, issueTitle, currentAssignee }: AssignIssueProps) {
  const { data: users } = useUsers();
  const updateIssue = useUpdateIssue();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState(currentAssignee || '');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter to field workers and department admins
  const assignableUsers = users?.filter(u => 
    u.roles.includes('field_worker') || u.roles.includes('department_admin')
  ) || [];

  const handleAssign = async () => {
    if (!selectedUser || selectedUser === 'unassigned') {
      // Unassign
      await updateIssue.mutateAsync({ id: issueId, assigned_to: undefined } as any);
      return;
    }

    setIsAssigning(true);
    try {
      // Update the issue assignment
      const { error } = await supabase
        .from('issues')
        .update({ assigned_to: selectedUser })
        .eq('id', issueId);

      if (error) throw error;

      // Send notification to the assigned user
      await supabase.rpc('insert_notification', {
        p_user_id: selectedUser,
        p_issue_id: issueId,
        p_title: 'Issue Assigned to You',
        p_message: `You have been assigned to issue: "${issueTitle.substring(0, 80)}"`,
        p_type: 'status_update',
      });

      toast.success('Issue assigned successfully!');
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign issue: ' + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserCheck className="h-4 w-4 text-primary" />
          Assign Issue
        </CardTitle>
        <CardDescription className="text-xs">
          Assign this issue to a field worker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger>
            <SelectValue placeholder="Select assignee..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {assignableUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name || u.email || u.id.substring(0, 8)}
                {u.roles.includes('field_worker') ? ' (Field Worker)' : ' (Dept Admin)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleAssign}
          disabled={isAssigning || !selectedUser}
        >
          {isAssigning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          {currentAssignee ? 'Reassign' : 'Assign'}
        </Button>
      </CardContent>
    </Card>
  );
}
