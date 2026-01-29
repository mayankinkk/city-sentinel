import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface VerificationOverviewProps {
  pendingCount: number;
  verifiedCount: number;
  invalidCount: number;
  spamCount: number;
  chartData: { name: string; value: number; color: string }[];
}

export function VerificationOverview({ 
  pendingCount, 
  verifiedCount, 
  invalidCount, 
  spamCount,
  chartData 
}: VerificationOverviewProps) {
  const stats = [
    { 
      label: 'Pending', 
      value: pendingCount, 
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20' 
    },
    { 
      label: 'Verified', 
      value: verifiedCount, 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20' 
    },
    { 
      label: 'Invalid', 
      value: invalidCount, 
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20' 
    },
    { 
      label: 'Spam', 
      value: spamCount, 
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-500/10 border-gray-500/20' 
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-orange-500" />
          Verification Overview
        </CardTitle>
        <CardDescription>
          Review and verify the authenticity of reported issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Verification Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`p-4 rounded-lg border ${stat.bgColor} transition-all duration-300 hover:scale-[1.02] animate-in fade-in-50 slide-in-from-bottom-2`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Verification Distribution Chart */}
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                animationDuration={800}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
