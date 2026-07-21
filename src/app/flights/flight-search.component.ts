import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchStateService } from '../shared/services/search-state.service';

interface Airport {
  code: string;
  city: string;
  airport: string;
}

interface Destination {
  city: string;
  code: string;
  airport: string;
  price: string;
  imageLabel: string;
}

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './flight-search.component.html',
  styleUrl: './flight-search.component.css',
})
export class FlightSearchComponent {
  private router = inject(Router);
  protected searchState = inject(SearchStateService);

  readonly airports: Airport[] = [
    { code: 'LHR', city: 'London',        airport: 'Heathrow' },
    { code: 'JFK', city: 'New York',      airport: 'John F. Kennedy' },
    { code: 'LAX', city: 'Los Angeles',   airport: 'Los Angeles Intl.' },
    { code: 'ORD', city: 'Chicago',       airport: "O'Hare Intl." },
    { code: 'SFO', city: 'San Francisco', airport: 'San Francisco Intl.' },
    { code: 'NRT', city: 'Tokyo',         airport: 'Narita Intl.' },
  ];

  readonly popularDestinations: Destination[] = [
    { city: 'Barcelona', code: 'BCN', airport: 'El Prat',         price: '£78',  imageLabel: 'city / beach photo' },
    { city: 'Reykjavík', code: 'KEF', airport: 'Keflavík Intl.',  price: '£120', imageLabel: 'landscape photo' },
    { city: 'Dubai',     code: 'DXB', airport: 'Intl.',            price: '£340', imageLabel: 'skyline photo' },
    { city: 'Tokyo',     code: 'HND', airport: 'Haneda',           price: '£520', imageLabel: 'street photo' },
  ];

  originCode      = signal('');
  destinationCode = signal('');
  date            = signal('');
  searchError     = signal('');
  swapRotation    = signal(0);
  attemptedSearch = signal(false);

  /** Today's date in the browser's local timezone, formatted as YYYY-MM-DD. */
  protected readonly minDate = this.toLocalDateString(new Date());

  protected readonly originAirport = computed(() =>
    this.airports.find(a => a.code === this.originCode()) ?? null);

  protected readonly destinationAirport = computed(() =>
    this.airports.find(a => a.code === this.destinationCode()) ?? null);

  swap(): void {
    const tmp = this.originCode();
    this.originCode.set(this.destinationCode());
    this.destinationCode.set(tmp);
    this.swapRotation.update(r => r + 180);
  }

  /**
   * Chrome only opens the native date picker dropdown when a click lands on
   * the input's own calendar-icon/value sub-widget, not just anywhere within
   * its (now full-height) box -- so stretching `.search-date-input` to cover
   * `.search-field-box` alone leaves clicks over the old hint-text/padding
   * area focusing the input without opening the picker. Explicitly opening
   * it on any click keeps that promise regardless of where in the box the
   * click lands.
   */
  openDatePicker(event: MouseEvent): void {
    const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // showPicker() throws if not called from a user gesture or if the
        // browser doesn't support it for this input type -- clicking still
        // focuses the input either way, so there's nothing else to do here.
      }
    }
  }

  search(): void {
    const missing: string[] = [];
    if (!this.originCode()) missing.push('origin');
    if (!this.destinationCode()) missing.push('destination');
    if (!this.date()) missing.push('departure date');

    if (missing.length) {
      const list = missing.length === 1
        ? missing[0]
        : missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1];
      this.searchError.set(`Please add the missing ${missing.length === 1 ? 'field' : 'fields'} before searching: ${list}.`);
      this.attemptedSearch.set(true);
      return;
    }

    if (this.date() < this.minDate) {
      this.searchError.set('Please choose a departure date of today or later.');
      this.attemptedSearch.set(true);
      return;
    }

    const orig = this.airports.find(a => a.code === this.originCode())!;
    const dest = this.airports.find(a => a.code === this.destinationCode())!;
    const date = this.date();
    this.searchState.setSearch(
      orig.code, orig.city, orig.airport,
      dest.code, dest.city, dest.airport,
      date,
    );
    this.searchError.set('');
    this.router.navigate(['/flights/results'], {
      queryParams: { origin: orig.code, destination: dest.code, date },
    });
  }

  selectDestination(dest: Destination): void {
    const orig = this.airports.find(a => a.code === (this.originCode() || 'LHR'))!;
    const date = this.date() || '2025-07-14';
    this.searchState.setSearch(
      orig.code, orig.city, orig.airport,
      dest.code, dest.city, dest.airport,
      date,
    );
    this.router.navigate(['/flights/results'], {
      queryParams: { origin: orig.code, destination: dest.code, date },
    });
  }

  /** Formats a Date using its local (not UTC) year/month/day as YYYY-MM-DD. */
  private toLocalDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
