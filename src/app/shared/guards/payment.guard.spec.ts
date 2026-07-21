import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { paymentGuard } from './payment.guard';
import { BookingFlowService } from '../services/booking-flow.service';
import { Flight, Seat } from '../models/flight.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const seat: Seat = { id: 's1', seatNumber: '12A', class: 'ECONOMY', available: true };

describe('paymentGuard', () => {
  let flow: BookingFlowService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    flow   = TestBed.inject(BookingFlowService);
    router = TestBed.inject(Router);
  });

  it('returns true when a seat is selected', () => {
    flow.selectFlight(flight);
    flow.selectSeat(seat);
    const result = TestBed.runInInjectionContext(
      () => paymentGuard({} as any, {} as any),
    );
    expect(result).toBeTrue();
  });

  it('redirects to /booking/seats when no seat is selected', () => {
    const result = TestBed.runInInjectionContext(
      () => paymentGuard({} as any, {} as any),
    );
    expect(result).toEqual(router.createUrlTree(['/booking/seats']));
  });
});
