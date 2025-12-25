import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { validateInviteToken, useInviteToken } from '@/hooks/useAdminInvites';
import { Shield, Loader2, Mail, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthorityAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  useEffect(() => {
    const checkToken = async () => {
      if (!inviteToken) {
        setIsValidating(false);
        return;
      }

      const invite = await validateInviteToken(inviteToken);
      if (invite) {
        setIsValidToken(true);
        setInviteEmail(invite.email);
        setValue('email', invite.email);
        setIsSignUp(true);
      }
      setIsValidating(false);
    };

    checkToken();
  }, [inviteToken, setValue]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (isSignUp && inviteToken) {
        // Sign up with invite token
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/authority`,
          },
        });

        if (signUpError) {
          toast.error(signUpError.message);
          return;
        }

        if (authData.user) {
          // Use the invite token to grant admin role
          const success = await useInviteToken(inviteToken, authData.user.id);
          if (success) {
            toast.success('Authority account created successfully!');
            navigate('/dashboard');
          } else {
            toast.error('Failed to activate admin privileges');
          }
        }
      } else {
        // Regular sign in - must already be an admin
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          toast.error('Invalid credentials');
          return;
        }

        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('role', 'admin')
          .single();

        if (!roleData) {
          await supabase.auth.signOut();
          toast.error('Access denied. This portal is for authorities only.');
          return;
        }

        toast.success('Welcome back, Authority!');
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Authority Portal - CityFix</title>
        <meta name="description" content="Authority login portal for CityFix administrators" />
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 shadow-lg mb-4">
              <Shield className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold">Authority Portal</h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? 'Create your authority account' : 'Sign in to manage city issues'}
            </p>
          </div>

          {inviteToken && !isValidToken && (
            <Card className="mb-6 border-destructive">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Invalid or Expired Invite</p>
                  <p className="text-sm text-muted-foreground">
                    This invite link is no longer valid. Please contact an administrator.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isValidToken && (
            <Card className="mb-6 border-status-resolved">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-5 w-5 text-status-resolved shrink-0" />
                <div>
                  <p className="font-medium text-status-resolved">Valid Invite</p>
                  <p className="text-sm text-muted-foreground">
                    Create your account using: {inviteEmail}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
              <CardDescription>
                {isSignUp 
                  ? 'Set up your authority account credentials' 
                  : 'Enter your credentials to access the authority dashboard'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="authority@city.gov"
                      className="pl-10"
                      disabled={isSignUp && isValidToken}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || (isSignUp && !isValidToken)}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isSignUp ? 'Create Authority Account' : 'Sign In'}
                </Button>

                {!inviteToken && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    New authority? Contact an existing admin to receive an invite.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
