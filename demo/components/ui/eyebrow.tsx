import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from './utils/classes';

const eyebrowVariants = cva('font-medium uppercase text-muted-foreground', {
  variants: {
    size: {
      default: 'text-[11px] tracking-wide',
      compact: 'text-[9px] leading-3 tracking-wider',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

type EyebrowSize = NonNullable<VariantProps<typeof eyebrowVariants>['size']>;

export type EyebrowProps = Omit<TextProps, 'children'> & {
  /** The short caption rendered as eyebrow text. */
  children: ReactNode;
  /** Typography for a standalone heading or a compact group caption. */
  size?: EyebrowSize;
  /** Additional utility classes for local placement and surface treatment. */
  className?: string;
};

export function Eyebrow({ children, size, className, ...props }: EyebrowProps) {
  return (
    <Text {...props} className={cn(eyebrowVariants({ size }), className)}>
      {children}
    </Text>
  );
}
