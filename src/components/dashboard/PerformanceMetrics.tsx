import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, Activity } from 'lucide-react';

interface PerformanceMetricsProps {
  resolutionRate: number;
  avgResolutionDays: number;
  inProgressCount: number;
}

export function PerformanceMetrics({ 
  resolutionRate, 
  avgResolutionDays, 
  inProgressCount 
}: PerformanceMetricsProps) {
  const metrics = [
    {
      label: 'Resolution Rate',
      value: `${resolutionRate}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Issues resolved',
    },
    {
      label: 'Avg. Resolution Time',
      value: `${avgResolutionDays} days`,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      description: 'Time to resolve',
    },
    {
      label: 'In Progress',
      value: `${inProgressCount}`,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Active issues',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card 
            key={metric.label} 
            className="overflow-hidden transition-all duration-300 hover:shadow-md animate-in fade-in-50 slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{metric.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
