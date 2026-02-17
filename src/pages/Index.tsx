import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, FileText, BarChart3, ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Index() {
  const { data: issues } = useIssues();
  const { user } = useAuth();

  const stats = {
    total: issues?.length || 0,
    pending: issues?.filter(i => i.status === 'pending').length || 0,
    inProgress: issues?.filter(i => i.status === 'in_progress').length || 0,
    resolved: issues?.filter(i => i.status === 'resolved').length || 0,
  };

  return (
    <>
      <Helmet>
        <title>City Sentinel - Report & Track City Infrastructure Issues</title>
        <meta name="description" content="Help improve your city by reporting potholes, broken streetlights, drainage issues and more. Track the status of reported problems in real-time." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="container relative mx-auto px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
                <MapPin className="h-4 w-4" />
                <span>Making cities better, one report at a time</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Report Issues.{' '}
                <span className="gradient-text">Track Progress.</span>{' '}
                Build Community.
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
                City Sentinel empowers citizens to report infrastructure problems and track their resolution. 
                Together, we can make our neighborhoods safer and more livable.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {user ? (
                  <Link to="/report">
                    <Button variant="hero" size="xl" className="gap-2">
                      Report an Issue
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant="hero" size="xl" className="gap-2">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/map">
                  <Button variant="outline" size="xl" className="gap-2">
                    <MapPin className="h-5 w-5" />
                    Explore Map
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="container mx-auto px-4 pb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <p className="text-3xl md:text-4xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Reports</p>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-3xl md:text-4xl font-bold text-status-pending">{stats.pending}</p>
                <p className="text-sm text-muted-foreground mt-1">Pending</p>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <p className="text-3xl md:text-4xl font-bold text-status-in-progress">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground mt-1">In Progress</p>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <p className="text-3xl md:text-4xl font-bold text-status-resolved">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground mt-1">Resolved</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to report an issue and track its resolution
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: MapPin,
                  title: 'Locate & Report',
                  description: 'Use GPS to pinpoint the issue location and submit a detailed report with photos.',
                  color: 'primary'
                },
                {
                  icon: Clock,
                  title: 'Track Progress',
                  description: 'Monitor the status of your reports in real-time as authorities work on solutions.',
                  color: 'accent'
                },
                {
                  icon: CheckCircle,
                  title: 'See Results',
                  description: 'Get notified when issues are resolved and see the positive impact on your community.',
                  color: 'primary'
                }
              ].map((feature, index) => (
                <div 
                  key={feature.title} 
                  className="relative p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 ${feature.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center glass-card rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 gradient-hero opacity-5" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to make a difference?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of citizens who are actively improving their communities through City Sentinel.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/map">
                    <Button variant="hero" size="lg" className="gap-2">
                      <MapPin className="h-5 w-5" />
                      View Issues Map
                    </Button>
                  </Link>
                  <Link to="/issues">
                    <Button variant="outline" size="lg" className="gap-2">
                      <FileText className="h-5 w-5" />
                      Browse All Issues
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms & Conditions Footer */}
        <footer className="py-12 border-t border-border bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Terms & Conditions</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li><strong className="text-foreground/80">Accuracy:</strong> All information submitted must be truthful and accurate to the best of your knowledge.</li>
              <li><strong className="text-foreground/80">No False Reports:</strong> Submitting false, misleading, or spam reports may result in immediate account suspension or permanent ban.</li>
              <li><strong className="text-foreground/80">Privacy:</strong> GPS and device metadata are automatically stripped from uploaded images. Your location data is used solely for issue mapping.</li>
              <li><strong className="text-foreground/80">Content Ownership:</strong> By uploading photos, you grant City Sentinel a non-exclusive license to use them for issue resolution and public display.</li>
              <li><strong className="text-foreground/80">No Guarantees:</strong> Reporting an issue does not guarantee resolution within a specific timeframe. Resolution depends on municipal authorities.</li>
              <li><strong className="text-foreground/80">Respectful Use:</strong> Offensive, abusive, or inappropriate content in reports or comments will be removed and may lead to account action.</li>
              <li><strong className="text-foreground/80">Data Retention:</strong> Reports and associated data are retained for public transparency and may be anonymized for analytics.</li>
            </ol>
            <p className="text-xs text-muted-foreground/60 mt-6">© {new Date().getFullYear()} City Sentinel. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
