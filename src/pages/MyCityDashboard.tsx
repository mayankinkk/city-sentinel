import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CitizenDashboard } from '@/components/citizen/CitizenDashboard';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export default function MyCityDashboard() {
  const { t } = useTranslation();
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
        <title>{t('citizenDashboard.title')} - City Sentinel</title>
        <meta name="description" content="Track your civic contribution. View your reported issues, resolution rate, and activity." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <CitizenDashboard />
      </div>
    </>
  );
}
