import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'default' | 'large';
  className?: string;
}

export function Logo({ size = 'default', className }: LogoProps) {
  const sizeClasses = {
    default: {
      container: 'gap-2',
      logo: 'h-16 w-auto', // Use w-auto to maintain aspect ratio
    },
    large: {
      container: 'gap-4',
      logo: 'h-40 w-auto', // Use w-auto to maintain aspect ratio
    },
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className={cn("flex items-center justify-center", selectedSize.container, className)}>
      <Icons.Logo className={selectedSize.logo} />
    </div>
  );
}
