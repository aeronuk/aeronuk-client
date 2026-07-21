// src/app/payment/payment-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { PaymentFormComponent } from './payment-form.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight, Seat } from '../shared/models/flight.model';
import { Booking } from '../shared/models/booking.model';
import { Payment } from '../shared/models/payment.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const seat: Seat = { id: 's1', seatNumber: '12A', class: 'ECONOMY', available: true };
const draft = {
  title: 'Mr', firstName: 'John', lastName: 'Doe', dob: '1990-01-01',
  nationality: 'GB', email: 'john@example.com', mobile: '07700900000',
};
const bookingResponse: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 361.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: draft.mobile },
  createdAt: '2024-01-15T10:00:00Z',
};
const paymentResponse: Payment = {
  id: 'p1', bookingCode: 'AX3KF7AB', amount: 361.99, currency: 'USD',
  status: 'SUCCESS', attempts: [], createdAt: '2024-01-15T10:01:00Z',
};

describe('PaymentFormComponent', () => {
  let fixture: ComponentFixture<PaymentFormComponent>;
  let component: PaymentFormComponent;
  let httpMock: HttpTestingController;
  let router: Router;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    flow = TestBed.inject(BookingFlowService);
    flow.selectFlight(flight);
    flow.selectSeat(seat);
    flow.setPassengerDraft(draft);

    fixture   = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
    router    = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('selectMethod() switches the active method and resets submitted/error state', () => {
    component.error.set('boom');
    component.selectMethod('paypal');

    expect(component.method()).toBe('paypal');
    expect(component.submitted()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('submitCard() with an invalid form marks it submitted and does not call the API', () => {
    component.submitCard();

    expect(component.submitted()).toBeTrue();
    expect(component.cardForm.invalid).toBeTrue();
    httpMock.expectNone('/api/bookings/generate-code');
  });

  it('submitCard() generates a code, then POSTs the booking and the payment', () => {
    component.cardForm.setValue({
      cardName: 'John Doe', cardNumber: '4111111111111111', expiry: '12/27',
      cvc: '123', address: '1 Main St', city: 'London', postcode: 'E1 6AN',
    });

    component.submitCard();

    const codeReq = httpMock.expectOne('/api/bookings/generate-code');
    expect(codeReq.request.method).toBe('GET');
    codeReq.flush({ bookingCode: 'AX3KF7AB' });

    const bookingReq = httpMock.expectOne('/api/bookings');
    expect(bookingReq.request.method).toBe('POST');
    expect(bookingReq.request.headers.get('X-Idempotency-Key')).toBe('AX3KF7AB');
    bookingReq.flush(bookingResponse);

    const paymentReq = httpMock.expectOne('/api/payments');
    expect(paymentReq.request.method).toBe('POST');
    expect(paymentReq.request.body).toEqual({
      bookingCode: 'AX3KF7AB',
      method: 'CREDIT_CARD',
      details: { cardNumber: '4111111111111111', expiryMonth: '12', expiryYear: '27', cvc: '123' },
    });
    paymentReq.flush(paymentResponse, { status: 201, statusText: 'Created' });
  });

  it('sets flow.payment and navigates to /booking/confirmation on success', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.cardForm.setValue({
      cardName: 'John Doe', cardNumber: '4111111111111111', expiry: '12/27',
      cvc: '123', address: '1 Main St', city: 'London', postcode: 'E1 6AN',
    });

    component.submitCard();

    httpMock.expectOne('/api/bookings/generate-code').flush({ bookingCode: 'AX3KF7AB' });
    httpMock.expectOne('/api/bookings').flush(bookingResponse);
    httpMock.expectOne('/api/payments').flush(paymentResponse, { status: 201, statusText: 'Created' });

    expect(flow.payment()).toEqual(paymentResponse);
    expect(navigateSpy).toHaveBeenCalledWith(['/booking/confirmation']);
  });

  it('shows an inline error and stops submitting when the payment call fails', () => {
    component.cardForm.setValue({
      cardName: 'John Doe', cardNumber: '4111111111111111', expiry: '12/27',
      cvc: '123', address: '1 Main St', city: 'London', postcode: 'E1 6AN',
    });

    component.submitCard();

    httpMock.expectOne('/api/bookings/generate-code').flush({ bookingCode: 'AX3KF7AB' });
    httpMock.expectOne('/api/bookings').flush(bookingResponse);
    httpMock.expectOne('/api/payments').flush(
      { error: 'Payment declined' },
      { status: 402, statusText: 'Payment Required' },
    );

    expect(component.error()).toBe('Payment failed. Please check your details and try again.');
    expect(component.submitting()).toBeFalse();
  });

  it('submitAltMethod() generates a code, POSTs the booking, and navigates without calling /api/payments', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.submitAltMethod();

    httpMock.expectOne('/api/bookings/generate-code').flush({ bookingCode: 'AX3KF7AB' });
    httpMock.expectOne('/api/bookings').flush(bookingResponse);
    httpMock.expectNone('/api/payments');

    expect(flow.booking()).toEqual(bookingResponse);
    expect(navigateSpy).toHaveBeenCalledWith(['/booking/confirmation']);
  });
});
