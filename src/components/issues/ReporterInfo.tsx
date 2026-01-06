import { useAuth } from '@/hooks/useAuth';
import { User } from 'lucide-react';

interface ReporterInfoProps {
  reporterEmail?: string;
}

/**
 * Masks an email address for privacy
 * e.g., "john.doe@example.com" -> "j***e@e***e.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***@***.***';
  
  const maskedLocal = localPart.length > 2 
    ? `${localPart[0]}***${localPart[localPart.length - 1]}`
    : `${localPart[0]}***`;
  
  const domainParts = domain.split('.');
  const maskedDomain = domainParts.map((part, index) => {
    if (index === domainParts.length - 1) return part; // Keep TLD
    return part.length > 2 
      ? `${part[0]}***${part[part.length - 1]}`
      : `${part[0]}***`;
  }).join('.');
  
  return `${maskedLocal}@${maskedDomain}`;
}

export function ReporterInfo({ reporterEmail }: ReporterInfoProps) {
  const { user, userRoles } = useAuth();
  
  // Determine what to show based on user role
  const getReporterDisplay = () => {
    // No email available
    if (!reporterEmail) {
      return {
        label: 'Reported by',
        value: 'Anonymous Citizen',
        showIcon: true,
      };
    }
    
    // Super Admin - can see full email
    if (userRoles.isSuperAdmin) {
      return {
        label: 'Reporter Email',
        value: reporterEmail,
        showIcon: false,
      };
    }
    
    // Admin, Authority (Department Admin), Field Worker, Moderator - masked email
    if (userRoles.isAdmin || userRoles.isDepartmentAdmin || userRoles.isFieldWorker || userRoles.isModerator) {
      return {
        label: 'Reporter',
        value: maskEmail(reporterEmail),
        showIcon: false,
        note: 'Email masked for privacy',
      };
    }
    
    // Regular logged-in users or guests - just show "Citizen"
    return {
      label: 'Reported by',
      value: 'Citizen',
      showIcon: true,
    };
  };
  
  const display = getReporterDisplay();
  
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{display.label}:</span>
      <span className="ml-2 inline-flex items-center gap-1.5">
        {display.showIcon && <User className="h-3.5 w-3.5 text-muted-foreground" />}
        <span>{display.value}</span>
      </span>
      {display.note && (
        <p className="text-xs text-muted-foreground mt-1">{display.note}</p>
      )}
    </div>
  );
}
