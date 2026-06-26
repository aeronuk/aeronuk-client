// src/app/payment/payment-receipt.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PaymentReceiptComponent } from './payment-receipt.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight } from '../shared/models/flight.model';
import { Booking } from '../shared/models/booking.model';
import { Payment } from '../shared/models/payment.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const booking: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};
const payment: Payment = {
  id: 'p1', bookingCode: 'AX3KF7AB', amount: 299.99, currency: 'USD',
  status: 'SUCCESS', attempts: [], createdAt: '2024-01-15T10:01:00Z',
};

describe('PaymentReceiptComponent', () => {
  let fixture: ComponentFixture<PaymentReceiptComponent>;
  let component: PaymentReceiptComponent;
  let httpMock: HttpTestingController;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentReceiptComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        BookingFlowService,
      ],
    }).compileComponents();

    flow = TestBed.inject(BookingFlowService);
    flow.selectFlight(flight);
    flow.setBooking(booking);
    flow.setPayment(payment);

    fixture   = TestBed.createComponent(PaymentReceiptComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts polling on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(2000);
    const req = httpMock.expectOne(r => r.url === '/api/bookings/AX3KF7AB' && r.params.get('lastName') === 'Doe');
    // Response not yet flushed — polling is in progress and booking is not resolved
    expect(component.resolvedBooking()).toBeNull();
    req.flush({ ...booking, status: 'CONFIRMED' });
    discardPeriodicTasks();
  }));

  it('stops polling and sets resolvedBooking when status is CONFIRMED', fakeAsync(() => {
    fixture.detectChanges();
    tick(2000);

    httpMock.expectOne(r => r.url === '/api/bookings/AX3KF7AB' && r.params.get('lastName') === 'Doe')
      .flush({ ...booking, status: 'CONFIRMED' });

    fixture.detectChanges();
    expect(component.resolvedBooking()).toEqual({ ...booking, status: 'CONFIRMED' });

    // No further poll should be made
    tick(2000);
    httpMock.expectNone(r => r.url === '/api/bookings/AX3KF7AB' && r.params.get('lastName') === 'Doe');
  }));

  it('stops polling and sets resolvedBooking when status is PAYMENT_FAILED', fakeAsync(() => {
    fixture.detectChanges();
    tick(2000);

    httpMock.expectOne(r => r.url === '/api/bookings/AX3KF7AB' && r.params.get('lastName') === 'Doe')
      .flush({ ...booking, status: 'PAYMENT_FAILED' });

    fixture.detectChanges();
    expect(component.resolvedBooking()).toEqual({ ...booking, status: 'PAYMENT_FAILED' });

    tick(2000);
    httpMock.expectNone(r => r.url === '/api/bookings/AX3KF7AB' && r.params.get('lastName') === 'Doe');
  }));

  it('stops polling and sets timedOut after 30 seconds', fakeAsync(() => {
    fixture.detectChanges();

    // At 30 000 ms the interval (15th tick) and timer(30000) both fire.
    // Use match() not expectOne() because the 15th HTTP request may or may
    // not still be pending depending on RxJS internal scheduling order.
    for (let i = 0; i < 15; i++) {
      tick(2000);
      httpMock.match(r => r.url === '/api/bookings/AX3KF7AB' && r.params.get('lastName') === 'Doe')
        .forEach(r => r.flush({ ...booking, status: 'PENDING' }));
    }

    fixture.detectChanges();
    expect(component.timedOut()).toBeTrue();

    tick(2000);
    httpMock.expectNone(r => r.url === '/api/bookings/AX3KF7AB' && r.params.get('lastName') === 'Doe');
  }));
});
