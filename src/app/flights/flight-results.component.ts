import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SearchStateService } from '../shared/services/search-state.service';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight } from '../shared/models/flight.model';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './flight-results.component.html',
  styleUrl: './flight-results.component.css',
})
export class FlightResultsComponent implements OnInit {
  private http    = inject(HttpClient);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);
  protected searchState = inject(SearchStateService);
  private flow    = inject(BookingFlowService);

  readonly depTimeSlots = [
    { key: 'morning',   label: 'Morning',   range: '06:00–12:00' },
    { key: 'afternoon', label: 'Afternoon', range: '12:00–18:00' },
    { key: 'evening',   label: 'Evening',   range: '18:00–00:00' },
    { key: 'night',     label: 'Night',     range: '00:00–06:00' },
  ];

  depTimeSelected = signal<Record<string, boolean>>({
    morning: true, afternoon: false, evening: false, night: false,
  });

  flights  = signal<Flight[]>([]);
  loading  = signal(true);
  screen   = signal<'loading' | 'results' | 'no-results' | 'error'>('loading');

  ngOnInit(): void {
    const preview = this.route.snapshot.queryParamMap.get('preview');
    if (preview === 'no-results') { this.loading.set(false); this.screen.set('no-results'); return; }
    if (preview === 'error')      { this.loading.set(false); this.screen.set('error');      return; }

    // Search criteria travel through the URL as query params so the results
    // page can be reloaded, bookmarked, or shared -- when they're present
    // (e.g. a direct/shared link), they take priority over whatever is
    // already sitting in SearchStateService; otherwise fall back to the
    // existing service state (e.g. arriving here via the search form, which
    // already populated it before navigating).
    const origin      = this.route.snapshot.queryParamMap.get('origin');
    const destination = this.route.snapshot.queryParamMap.get('destination');
    const date        = this.route.snapshot.queryParamMap.get('date');
    if (origin && destination && date) {
      this.searchState.origin.set(origin);
      this.searchState.destination.set(destination);
      this.searchState.date.set(date);
    }

    const params = new HttpParams()
      .set('origin',      this.searchState.origin())
      .set('destination', this.searchState.destination())
      .set('date',        this.searchState.date());

    this.http.get<Flight[]>('/api/flights', { params }).subscribe({
      next: flights => {
        this.flights.set(flights);
        this.loading.set(false);
        this.screen.set(flights.length === 0 ? 'no-results' : 'results');
      },
      error: () => { this.loading.set(false); this.screen.set('error'); },
    });
  }

  toggleDepTime(key: string): void {
    this.depTimeSelected.update(s => ({ ...s, [key]: !s[key] }));
  }

  selectFlight(flight: Flight): void {
    this.flow.selectFlight(flight);
    this.router.navigate(['/booking']);
  }

  getFlightTag(flight: Flight): string {
    const list = this.flights();
    if (!list.length) return '';
    const prices = list.map(f => f.price.amount);
    const minPrice = Math.min(...prices);
    if (flight.price.amount === minPrice) return 'Cheapest';
    if (list.indexOf(flight) === 0) return 'Best';
    return '';
  }

  getTagClass(tag: string): string {
    if (tag === 'Cheapest') return 'flight-tag flight-tag--cheapest';
    if (tag === 'Fastest')  return 'flight-tag flight-tag--fastest';
    return 'flight-tag flight-tag--best';
  }

  formatTime(iso: string): string {
    try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }); }
    catch { return iso; }
  }

  formatPrice(flight: Flight): string {
    const sym = flight.price.currency === 'GBP' ? '£' : flight.price.currency;
    return `${sym}${flight.price.amount}`;
  }
}
