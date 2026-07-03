import { Component, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { Flight } from '../shared/models/flight.model';
import { FlightResultsComponent } from './flight-results.component';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [ReactiveFormsModule, FlightResultsComponent],
  templateUrl: './flight-search.component.html',
})
export class FlightSearchComponent {
  private http = inject(HttpClient);

  readonly airportCodes = ['JFK', 'LAX', 'ORD', 'SFO', 'LHR', 'NRT'];

  readonly popularDestinations = [
    { city: 'New York', code: 'JFK', price: 299, imageLabel: 'city / skyline' },
    { city: 'Los Angeles', code: 'LAX', price: 349, imageLabel: 'city / beach' },
    { city: 'London', code: 'LHR', price: 189, imageLabel: 'city / landmarks' },
    { city: 'Tokyo', code: 'NRT', price: 649, imageLabel: 'city / temple' },
  ];

  form = new FormGroup({
    origin:      new FormControl('', Validators.required),
    destination: new FormControl('', Validators.required),
    date:        new FormControl('', Validators.required),
  });

  results = signal<Flight[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  search(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { origin, destination, date } = this.form.value;
    const params = new HttpParams()
      .set('origin', origin!)
      .set('destination', destination!)
      .set('date', date!);

    this.http.get<Flight[]>('/api/flights', { params }).subscribe({
      next: flights => { this.results.set(flights); this.loading.set(false); },
      error: ()     => { this.error.set('Search failed. Please try again.'); this.loading.set(false); },
    });
  }
}
