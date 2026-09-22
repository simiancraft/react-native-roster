import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from './utils/classes';

const cardVariants = cva('rounded-xl border', {
  variants: {
    tone: {
      default: 'border-border bg-card',
      inset: 'border-border bg-background',
      dashed: 'border-dashed border-grid-strong bg-background',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

type CardTone = NonNullable<VariantProps<typeof cardVariants>['tone']>;

export type CardProps = Omit<ViewProps, 'children'> & {
  /** The content arranged inside the card. */
  contentZone: ReactNode;
  /** Visual chrome for a panel, an inset surface, or a dashed inset. */
  tone?: CardTone;
  /** Additional utility classes for card layout and local sizing. */
  className?: string;
};

export function Card({ contentZone, tone, className, ...props }: CardProps) {
  return (
    <View {...props} className={cn(cardVariants({ tone }), className)}>
      {contentZone}
    </View>
  );
}
