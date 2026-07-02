import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmCardHeader],hlm-card-header',
  host: { 'data-slot': 'card-header' },
})
export class HlmCardHeader {
  constructor() {
    classes(() => 'grid auto-rows-min items-start gap-1 px-[--card-spacing]');
  }
}
