import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface StatusDistributionChartProps {
  data: { name: string; value: number; color: string }[];
  title?: string;
  icon?: React.ReactNode;
}

export function StatusDistributionChart({ 
  data, 
  title = 'Status Distribution',
  icon
}: StatusDistributionChartProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon || <PieChartIcon className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                animationDuration={800}
                animationBegin={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-3">
            <PieChartIcon className="h-12 w-12 opacity-30" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
