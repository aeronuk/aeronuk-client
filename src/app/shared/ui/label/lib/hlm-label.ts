import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmLabel]',
  host: { 'data-slot': 'label' },
})
export class HlmLabel {
  constructor() {
    classes(() => 'flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50');
  }
}
