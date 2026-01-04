import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user' | 'super_admin' | 'department_admin' | 'field_worker' | 'moderator';

interface UserRoles {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDepartmentAdmin: boolean;
  isFieldWorker: boolean;
  isModerator: boolean;
  isAuthority: boolean; // Combined: super_admin, admin, or department_admin
  canVerifyIssues: boolean; // moderator or higher
  canUpdateStatus: boolean; // department_admin, admin, or super_admin
  canDeleteIssues: boolean; // admin or super_admin
  canManageAdmins: boolean; // super_admin only
  roles: AppRole[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean; // Legacy support - true for any admin role
  userRoles: UserRoles;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const defaultRoles: UserRoles = {
  isSuperAdmin: false,
  isAdmin: false,
  isDepartmentAdmin: false,
  isFieldWorker: false,
  isModerator: false,
  isAuthority: false,
  canVerifyIssues: false,
  canUpdateStatus: false,
  canDeleteIssues: false,
  canManageAdmins: false,
  roles: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoles>(defaultRoles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserRoles(defaultRoles);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (!error && data) {
      const roles = data.map(r => r.role as AppRole);
      
      const isSuperAdmin = roles.includes('super_admin');
      const isAdmin = roles.includes('admin');
      const isDepartmentAdmin = roles.includes('department_admin');
      const isFieldWorker = roles.includes('field_worker');
      const isModerator = roles.includes('moderator');

      setUserRoles({
        isSuperAdmin,
        isAdmin,
        isDepartmentAdmin,
        isFieldWorker,
        isModerator,
        isAuthority: isSuperAdmin || isAdmin || isDepartmentAdmin,
        canVerifyIssues: isSuperAdmin || isAdmin || isModerator,
        canUpdateStatus: isSuperAdmin || isAdmin || isDepartmentAdmin,
        canDeleteIssues: isSuperAdmin || isAdmin,
        canManageAdmins: isSuperAdmin,
        roles,
      });
    } else {
      setUserRoles(defaultRoles);
    }
  };

  // Legacy isAdmin - true for any admin-level role
  const isAdmin = userRoles.isSuperAdmin || userRoles.isAdmin || userRoles.isDepartmentAdmin;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRoles(defaultRoles);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, userRoles, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
