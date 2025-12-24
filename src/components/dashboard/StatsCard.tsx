import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning' | 'success';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary/5 border-primary/20',
  accent: 'bg-accent/5 border-accent/20',
  warning: 'bg-status-pending-bg border-status-pending/20',
  success: 'bg-status-resolved-bg border-status-resolved/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  warning: 'bg-status-pending/10 text-status-pending',
  success: 'bg-status-resolved/10 text-status-resolved',
};

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  return (
    <Card className={cn('transition-all duration-300 hover:shadow-md', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-status-resolved' : 'text-destructive'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
