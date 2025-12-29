import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { IssueForm } from '@/components/issues/IssueForm';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function ReportIssue() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Report Issue - City Sentinel</title>
        <meta name="description" content="Report a city infrastructure problem. Help improve your neighborhood by reporting potholes, broken lights, and other issues." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <IssueForm />
      </div>
    </>
  );
}
