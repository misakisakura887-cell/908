import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-br from-bg-tertiary to-[#2a3558] border border-gray-700 rounded-xl p-6",
          "hover:border-accent-blue/50 hover:shadow-xl transition-all duration-300",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
