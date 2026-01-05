import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useUsers, useAddUserRole, useRemoveUserRole, useAssignDepartment, useRemoveDepartment } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Crown, 
  UserCog, 
  Building2, 
  Eye, 
  User, 
  Loader2, 
  Plus, 
  X, 
  Search,
  Shield,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ElementType; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Crown, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  admin: { label: 'Admin', icon: UserCog, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  department_admin: { label: 'Authority', icon: Building2, color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  moderator: { label: 'Moderator', icon: Eye, color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  field_worker: { label: 'Field Worker', icon: User, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
  user: { label: 'User', icon: User, color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
};

const AVAILABLE_ROLES: AppRole[] = ['super_admin', 'admin', 'department_admin', 'moderator', 'field_worker'];

export default function UserManagement() {
  const { userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: departments } = useDepartments();
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const assignDept = useAssignDepartment();
  const removeDept = useRemoveDepartment();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !userRoles.isSuperAdmin) {
      navigate('/dashboard');
    }
  }, [userRoles.isSuperAdmin, loading, navigate]);

  if (loading || usersLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userRoles.isSuperAdmin) {
    return null;
  }

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.roles.includes(selectedRole as AppRole);
    
    return matchesSearch && matchesRole;
  }) || [];

  const handleAddRole = (userId: string, role: AppRole) => {
    addRole.mutate({ userId, role });
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    removeRole.mutate({ userId, role });
  };

  const handleAssignDepartment = (userId: string, departmentId: string) => {
    assignDept.mutate({ userId, departmentId });
  };

  const handleRemoveDepartment = (userId: string, departmentId: string) => {
    removeDept.mutate({ userId, departmentId });
  };

  // Stats
  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.roles.some(r => ['super_admin', 'admin'].includes(r))).length || 0;
  const authorityCount = users?.filter(u => u.roles.includes('department_admin')).length || 0;
  const moderatorCount = users?.filter(u => u.roles.includes('moderator')).length || 0;

  return (
    <>
      <Helmet>
        <title>User Management - City Sentinel</title>
        <meta name="description" content="Manage user roles and department assignments for City Sentinel." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage user roles and department assignments. Only Super Admins can access this page.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <UserCog className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{adminCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Authority Admins</p>
                  <p className="text-2xl font-bold">{authorityCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Eye className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moderators</p>
                  <p className="text-2xl font-bold">{moderatorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {AVAILABLE_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_CONFIG[role].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Click on a user row to manage their roles and departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                No roles
                              </Badge>
                            ) : (
                              user.roles.map(role => {
                                const config = ROLE_CONFIG[role];
                                const Icon = config.icon;
                                return (
                                  <Badge key={role} variant="outline" className={`gap-1 ${config.color}`}>
                                    <Icon className="h-3 w-3" />
                                    {config.label}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.departments.length === 0 ? (
                              <span className="text-sm text-muted-foreground">None</span>
                            ) : (
                              user.departments.map(dept => (
                                <Badge key={dept.id} variant="secondary" className="gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {dept.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(user.created_at), 'PP')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={editingUser === user.id} onOpenChange={(open) => setEditingUser(open ? user.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Manage User</DialogTitle>
                                <DialogDescription>
                                  {user.full_name || 'Unnamed User'} ({user.id.slice(0, 8)}...)
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                {/* Roles Section */}
                                <div>
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Roles
                                  </h4>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {user.roles.map(role => {
                                      const config = ROLE_CONFIG[role];
                                      const Icon = config.icon;
                                      return (
                                        <Badge key={role} variant="outline" className={`gap-1 pr-1 ${config.color}`}>
                                          <Icon className="h-3 w-3" />
                                          {config.label}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                            onClick={() => handleRemoveRole(user.id, role)}
                                            disabled={removeRole.isPending}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                  <Select
                                    onValueChange={(value) => handleAddRole(user.id, value as AppRole)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Add role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_ROLES.filter(r => !user.roles.includes(r)).map(role => (
                                        <SelectItem key={role} value={role}>
                                          <div className="flex items-center gap-2">
                                            {(() => {
                                              const Icon = ROLE_CONFIG[role].icon;
                                              return <Icon className="h-4 w-4" />;
                                            })()}
                                            {ROLE_CONFIG[role].label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Departments Section */}
                                {user.roles.includes('department_admin') && (
                                  <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      Assigned Departments
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                      Authority Admins can only manage issues in their assigned departments.
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {user.departments.map(dept => (
                                        <Badge key={dept.id} variant="secondary" className="gap-1 pr-1">
                                          <Building2 className="h-3 w-3" />
                                          {dept.name}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                            onClick={() => handleRemoveDepartment(user.id, dept.id)}
                                            disabled={removeDept.isPending}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </Badge>
                                      ))}
                                      {user.departments.length === 0 && (
                                        <span className="text-sm text-muted-foreground">No departments assigned</span>
                                      )}
                                    </div>
                                    <Select
                                      onValueChange={(value) => handleAssignDepartment(user.id, value)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Assign department..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments?.filter(d => !user.departments.some(ud => ud.id === d.id)).map(dept => (
                                          <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
