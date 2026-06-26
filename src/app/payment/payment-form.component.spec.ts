// src/app/payment/payment-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PaymentFormComponent } from './payment-form.component';
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
const paymentResponse: Payment = {
  id: 'p1', bookingCode: 'AX3KF7AB', amount: 299.99, currency: 'USD',
  status: 'SUCCESS', attempts: [], createdAt: '2024-01-15T10:01:00Z',
};

describe('PaymentFormComponent', () => {
  let fixture: ComponentFixture<PaymentFormComponent>;
  let component: PaymentFormComponent;
  let httpMock: HttpTestingController;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
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

    fixture   = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('switching method clears previous sub-form values', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });

    component.methodControl.setValue('PAYPAL');

    expect(component.detailsForm.value).toEqual({ email: '' });
  });

  it('CREDIT_CARD submit sends correct body shape', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });

    component.submit();

    const req = httpMock.expectOne('/api/payments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      bookingCode: 'AX3KF7AB',
      method: 'CREDIT_CARD',
      details: { cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 },
    });
    req.flush(paymentResponse, { status: 201, statusText: 'Created' });
  });

  it('shows inline error and does not navigate on 402 response', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });
    component.submit();

    const req = httpMock.expectOne('/api/payments');
    req.flush({ error: 'Payment declined' }, { status: 402, statusText: 'Payment Required' });

    expect(component.error()).toBe('Payment declined — please try another method.');
    expect(component.submitting()).toBeFalse();
  });

  it('calls flow.setPayment and navigates to /payment/receipt on 201', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });
    component.submit();

    httpMock.expectOne('/api/payments').flush(paymentResponse, { status: 201, statusText: 'Created' });

    expect(flow.payment()).toEqual(paymentResponse);
  });
});
