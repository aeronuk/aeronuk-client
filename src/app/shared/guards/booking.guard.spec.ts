import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { bookingGuard } from './booking.guard';
import { BookingFlowService } from '../services/booking-flow.service';
import { Flight } from '../models/flight.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};

describe('bookingGuard', () => {
  let flow: BookingFlowService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    flow   = TestBed.inject(BookingFlowService);
    router = TestBed.inject(Router);
  });

  it('returns true when flight is selected', () => {
    flow.selectFlight(flight);
    const result = TestBed.runInInjectionContext(
      () => bookingGuard({} as any, {} as any),
    );
    expect(result).toBeTrue();
  });

  it('redirects to /flights when no flight is selected', () => {
    const result = TestBed.runInInjectionContext(
      () => bookingGuard({} as any, {} as any),
    );
    expect(result).toEqual(router.createUrlTree(['/flights']));
  });
});
