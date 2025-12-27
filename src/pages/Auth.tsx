import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type AuthFormData = z.infer<typeof authSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: errorsForgot },
    reset: resetForgot,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (activeTab === 'signin') {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back!');
        navigate('/');
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('An account with this email already exists. Please sign in.');
            setActiveTab('signin');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Account created successfully! You are now signed in.');
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      resetForgot();
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero shadow-lg mb-4">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to CityFix</h1>
          <p className="text-muted-foreground mt-2">
            {showForgotPassword 
              ? 'Enter your email to reset your password'
              : 'Sign in to report issues and track their progress'}
          </p>
        </div>

        <Card>
          {showForgotPassword ? (
            <>
              <CardHeader className="pb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-fit gap-2 -ml-2"
                  onClick={() => { setShowForgotPassword(false); resetForgot(); }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Button>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  We'll send you an email with a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitForgot(onForgotPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10"
                        {...registerForgot('email')}
                      />
                    </div>
                    {errorsForgot.email && (
                      <p className="text-sm text-destructive">{errorsForgot.email.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-4">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); reset(); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                        placeholder="name@example.com"
                        className="pl-10"
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

                  {activeTab === 'signin' && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-sm"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot your password?
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Are you an authority?{' '}
                        <a href="/authority" className="text-primary hover:underline font-medium">
                          Admin Login
                        </a>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
