import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { paymentGuard } from './payment.guard';
import { BookingFlowService } from '../services/booking-flow.service';
import { Booking } from '../models/booking.model';

const booking: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};

describe('paymentGuard', () => {
  let flow: BookingFlowService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    flow   = TestBed.inject(BookingFlowService);
    router = TestBed.inject(Router);
  });

  it('returns true when booking is set', () => {
    flow.setBooking(booking);
    const result = TestBed.runInInjectionContext(
      () => paymentGuard({} as any, {} as any),
    );
    expect(result).toBeTrue();
  });

  it('redirects to /booking when no booking is set', () => {
    const result = TestBed.runInInjectionContext(
      () => paymentGuard({} as any, {} as any),
    );
    expect(result).toEqual(router.createUrlTree(['/booking']));
  });
});
