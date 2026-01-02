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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, Mail, Lock, ArrowLeft, User, Phone, MapPinned } from 'lucide-react';
import { toast } from 'sonner';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Sign up initial details schema (collected before OTP)
const signUpInitialSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
});

// Sign up password schema (collected after OTP verification)
const signUpPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().min(5, 'Address is required'),
});

const signInPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type SignUpInitialFormData = z.infer<typeof signUpInitialSchema>;
type SignUpPasswordFormData = z.infer<typeof signUpPasswordSchema>;
type SignInPasswordFormData = z.infer<typeof signInPasswordSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type AuthStep = 'email' | 'signup-details' | 'otp' | 'signup-password' | 'signin-password';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [signUpData, setSignUpData] = useState<{ full_name: string; phone: string } | null>(null);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const signUpInitialForm = useForm<SignUpInitialFormData>({
    resolver: zodResolver(signUpInitialSchema),
  });

  const signUpPasswordForm = useForm<SignUpPasswordFormData>({
    resolver: zodResolver(signUpPasswordSchema),
  });

  const signInPasswordForm = useForm<SignInPasswordFormData>({
    resolver: zodResolver(signInPasswordSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const resetAuthFlow = () => {
    setAuthStep('email');
    setEmail('');
    setOtpCode('');
    setSignUpData(null);
    emailForm.reset();
    signUpInitialForm.reset();
    signUpPasswordForm.reset();
    signInPasswordForm.reset();
  };

  // Sign In: Send OTP to email (6-digit code)
  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      setEmail(data.email);
      
      // For sign in, check if user exists first, then send OTP code
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false,
        },
      });
      
      if (error) {
        if (error.message.includes('Signups not allowed')) {
          toast.error('No account found with this email. Please sign up first.');
          setActiveTab('signup');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success('A 6-digit verification code has been sent to your email!');
      setAuthStep('otp');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Step 1: Collect initial details (name, phone, email) then send OTP
  const onSignUpInitialSubmit = async (data: SignUpInitialFormData) => {
    setIsLoading(true);
    try {
      setEmail(data.email);
      setSignUpData({ full_name: data.full_name, phone: data.phone });
      
      // Send OTP code for sign up
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
        },
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('A 6-digit verification code has been sent to your email!');
      setAuthStep('otp');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const onVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) {
        toast.error('Invalid verification code. Please try again.');
        return;
      }

      if (activeTab === 'signin') {
        // Check if user is admin
        if (data.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (roleData) {
            await supabase.auth.signOut();
            toast.error('Authority accounts must sign in through the Authority Portal');
            resetAuthFlow();
            return;
          }
        }

        toast.success('Welcome back!');
        navigate('/');
      } else {
        // For sign up, proceed to set password and address
        setAuthStep('signup-password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Step 3: Set password and address after OTP verification
  const onSignUpPassword = async (data: SignUpPasswordFormData) => {
    setIsLoading(true);
    try {
      // Get the current session
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast.error('Session expired. Please try again.');
        resetAuthFlow();
        return;
      }

      // Update user password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (passwordError) {
        toast.error('Failed to set password: ' + passwordError.message);
        return;
      }

      // Save profile data (using signUpData collected earlier)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: session.session.user.id,
          full_name: signUpData?.full_name || '',
          phone: signUpData?.phone || '',
          address: data.address,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error('Failed to save profile details');
        return;
      }

      toast.success('Account created successfully!');
      navigate('/');
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
      forgotPasswordForm.reset();
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with password (fallback)
  const onSignInWithPassword = async (data: SignInPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(email, data.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Check if user is an admin
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          await supabase.auth.signOut();
          toast.error('Authority accounts must sign in through the Authority Portal');
          return;
        }
      }

      toast.success('Welcome back!');
      navigate('/');
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

  const renderAuthContent = () => {
    if (showForgotPassword) {
      return (
        <>
          <CardHeader className="pb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-fit gap-2 -ml-2"
              onClick={() => { setShowForgotPassword(false); forgotPasswordForm.reset(); }}
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
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    {...forgotPasswordForm.register('email')}
                  />
                </div>
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{forgotPasswordForm.formState.errors.email.message}</p>
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
      );
    }

    // OTP Verification Step
    if (authStep === 'otp') {
      return (
        <>
          <CardHeader className="pb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-fit gap-2 -ml-2"
              onClick={resetAuthFlow}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="button"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading || otpCode.length !== 6}
              onClick={onVerifyOtp}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verify Code
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm"
                disabled={isLoading}
                onClick={() => onEmailSubmit({ email })}
              >
                Didn't receive the code? Resend
              </Button>
            </div>
          </CardContent>
        </>
      );
    }

    // Sign Up Password Step (after OTP verification)
    if (authStep === 'signup-password') {
      return (
        <>
          <CardHeader className="pb-4">
            <CardTitle>Set Your Password</CardTitle>
            <CardDescription>
              Create a password and add your address to complete registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={signUpPasswordForm.handleSubmit(onSignUpPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Create Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...signUpPasswordForm.register('password')}
                  />
                </div>
                {signUpPasswordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signUpPasswordForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <div className="relative">
                  <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, City"
                    className="pl-10"
                    {...signUpPasswordForm.register('address')}
                  />
                </div>
                {signUpPasswordForm.formState.errors.address && (
                  <p className="text-sm text-destructive">{signUpPasswordForm.formState.errors.address.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Complete Registration
              </Button>
            </form>
          </CardContent>
        </>
      );
    }

    // Email Entry Step (Sign In) or Details Entry Step (Sign Up)
    return (
      <>
        <CardHeader className="pb-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetAuthFlow(); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {activeTab === 'signin' ? (
            // Sign In: Just email
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    {...emailForm.register('email')}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

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

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Continue with Email
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We'll send a 6-digit verification code to your email
              </p>
            </form>
          ) : (
            // Sign Up: Full name, phone, email first
            <form onSubmit={signUpInitialForm.handleSubmit(onSignUpInitialSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup_full_name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup_full_name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    {...signUpInitialForm.register('full_name')}
                  />
                </div>
                {signUpInitialForm.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{signUpInitialForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup_phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup_phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    className="pl-10"
                    {...signUpInitialForm.register('phone')}
                  />
                </div>
                {signUpInitialForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">{signUpInitialForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup_email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup_email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    {...signUpInitialForm.register('email')}
                  />
                </div>
                {signUpInitialForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signUpInitialForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Get Verification Code
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We'll send a 6-digit verification code to your email
              </p>
            </form>
          )}
        </CardContent>
      </>
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero shadow-lg mb-4">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to City Sentinel</h1>
          <p className="text-muted-foreground mt-2">
            {showForgotPassword 
              ? 'Enter your email to reset your password'
              : authStep === 'otp'
              ? 'Verify your email address'
              : authStep === 'signup-password'
              ? 'Set your password'
              : 'Sign in to report issues and track their progress'}
          </p>
        </div>

        <Card>
          {renderAuthContent()}
        </Card>
      </div>
    </div>
  );
}