import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { type HlmCardConfig, injectHlmCardConfig } from './hlm-card.token';

@Directive({
  selector: '[hlmCard],hlm-card',
  host: { 'data-slot': 'card', '[attr.data-size]': 'size()' },
})
export class HlmCard {
  private readonly _defaultConfig = injectHlmCardConfig();
  public readonly size = input<HlmCardConfig['size']>(this._defaultConfig.size);
  constructor() {
    classes(() => 'group/card flex flex-col overflow-hidden rounded-xl py-[--card-spacing] text-sm ring-1 ring-foreground/10 bg-card text-card-foreground gap-[--card-spacing] [--card-spacing:1rem] has-data-[slot=card-footer]:pb-0');
  }
}
