import { CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerifiedBadge = ({ isVerified, size = 'md', className = '' }: VerifiedBadgeProps) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <CheckCircle 
      className={`text-yellow-500 fill-yellow-500 ${sizeClasses[size]} ${className}`}
      aria-label="Verified user"
    />
  );
};
