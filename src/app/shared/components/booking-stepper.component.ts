import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

interface Step {
  label: string;
  active: boolean;
  done: boolean;
  route: string;
}

@Component({
  selector: 'app-booking-stepper',
  standalone: true,
  imports: [],
  templateUrl: './booking-stepper.component.html',
  styleUrl: './booking-stepper.component.css',
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

  protected readonly steps = computed<Step[]>(() => {
    const u = this.url() ?? '';
    let activeIdx = 0;

    if (u.startsWith('/booking/confirmation')) {
      activeIdx = 6;
    } else if (u.startsWith('/payment')) {
      activeIdx = 5;
    } else if (u.startsWith('/booking/seats')) {
      activeIdx = 4;
    } else if (u.startsWith('/booking/passenger')) {
      activeIdx = 3;
    } else if (u.startsWith('/booking')) {
      activeIdx = 2;
    } else if (u.startsWith('/flights/results')) {
      activeIdx = 2;
    }

    const defs = [
      { label: 'Search',     route: '/flights' },
      { label: 'Select',     route: '/flights/results' },
      { label: 'Passengers', route: '/booking/passenger' },
      { label: 'Seats',      route: '/booking/seats' },
      { label: 'Payment',    route: '/payment' },
    ];

    return defs.map((d, i) => {
      const idx = i + 1;
      return {
        label:  d.label,
        route:  d.route,
        active: activeIdx === idx,
        done:   activeIdx > idx,
      };
    });
  });

  navigate(step: Step): void {
    if (step.done) this.router.navigate([step.route]);
  }
}
