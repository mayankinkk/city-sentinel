import { Badge } from '@/components/ui/badge';
import { VerificationStatus, verificationStatusLabels, verificationStatusColors } from '@/types/issue';
import { ShieldCheck, ShieldX, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface VerificationBadgeProps {
  status: VerificationStatus;
}

const icons: Record<VerificationStatus, typeof ShieldCheck> = {
  pending_verification: ShieldQuestion,
  verified: ShieldCheck,
  invalid: ShieldX,
  spam: ShieldAlert,
};

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const Icon = icons[status];
  
  return (
    <Badge variant="outline" className={`gap-1 ${verificationStatusColors[status]}`}>
      <Icon className="h-3 w-3" />
      {verificationStatusLabels[status]}
    </Badge>
  );
}
