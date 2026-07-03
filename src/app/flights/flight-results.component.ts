import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Flight } from '../shared/models/flight.model';
import { BookingFlowService } from '../shared/services/booking-flow.service';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
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
