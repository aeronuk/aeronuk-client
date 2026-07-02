import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap h-5 gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium transition-all',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        outline: 'border-border text-foreground',
        ghost: 'text-muted-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Directive({
  selector: '[hlmBadge],hlm-badge',
  host: { 'data-slot': 'badge', '[attr.data-variant]': 'variant()' },
})
export class HlmBadge {
  public readonly variant = input<BadgeVariants['variant']>('default');
  constructor() {
    classes(() => badgeVariants({ variant: this.variant() }));
  }
}
