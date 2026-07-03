import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-booking-stepper',
  standalone: true,
  imports: [NgClass],
  templateUrl: './booking-stepper.component.html',
})
export class BookingStepperComponent {
  private router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly steps = ['Select', 'Passengers', 'Review', 'Payment'] as const;

  protected readonly currentStep = computed((): number => {
    const u = this.url() ?? '';
    if (u.includes('/booking/confirmation')) return 3;
    if (u.includes('/booking/passenger')) return 2;
    if (u.startsWith('/booking')) return 1;
    if (u.startsWith('/payment')) return 4;
    return 0;
  });
}
