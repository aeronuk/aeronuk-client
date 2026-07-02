import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Flight } from '../shared/models/flight.model';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { HlmCardImports } from '../shared/ui/card';
import { HlmButtonImports } from '../shared/ui/button';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ...HlmCardImports, ...HlmButtonImports],
  templateUrl: './flight-results.component.html',
})
export class FlightResultsComponent {
  results = input<Flight[]>([]);

  private flow   = inject(BookingFlowService);
  private router = inject(Router);

  select(flight: Flight): void {
    this.flow.selectFlight(flight);
    this.router.navigate(['/booking']);
  }
}
