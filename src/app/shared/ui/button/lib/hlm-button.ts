import { Directive, input, signal } from '@angular/core';
import { BrnButton } from '@spartan-ng/brain/button';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ClassValue } from 'clsx';
import { injectBrnButtonConfig } from './hlm-button.token';

export const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive/10 hover:bg-destructive/20 text-destructive focus-visible:border-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 gap-1.5 px-2.5',
        xs: 'h-6 gap-1 px-2 text-xs',
        sm: 'h-7 gap-1 px-2.5 text-[0.8rem]',
        lg: 'h-9 gap-1.5 px-3',
        icon: 'size-8',
        'icon-xs': 'size-6',
        'icon-sm': 'size-7',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
  selector: 'button[hlmBtn], a[hlmBtn]',
  exportAs: 'hlmBtn',
  hostDirectives: [{ directive: BrnButton, inputs: ['disabled'] }],
  host: { 'data-slot': 'button' },
})
export class HlmButton {
  private readonly _config = injectBrnButtonConfig();
  private readonly _additionalClasses = signal<ClassValue>('');
  public readonly variant = input<ButtonVariants['variant']>(this._config.variant);
  public readonly size = input<ButtonVariants['size']>(this._config.size);

  constructor() {
    classes(() => [buttonVariants({ variant: this.variant(), size: this.size() }), this._additionalClasses()]);
  }

  setClass(cls: string): void { this._additionalClasses.set(cls); }
}
