// src/app/booking/passenger-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PassengerFormComponent } from './passenger-form.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight, Seat } from '../shared/models/flight.model';
import { Booking } from '../shared/models/booking.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const seat: Seat = { id: 's1', seatNumber: '12A', class: 'ECONOMY', available: true };
const bookingResponse: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};

describe('PassengerFormComponent', () => {
  let fixture: ComponentFixture<PassengerFormComponent>;
  let component: PassengerFormComponent;
  let httpMock: HttpTestingController;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        BookingFlowService,
      ],
    }).compileComponents();

    flow     = TestBed.inject(BookingFlowService);
    flow.selectFlight(flight);
    flow.selectSeat(seat);

    fixture   = TestBed.createComponent(PassengerFormComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('form is invalid when email is malformed', () => {
    component.form.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'not-an-email', phone: '',
    });
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when firstName is missing', () => {
    component.form.patchValue({
      firstName: '', lastName: 'Doe', email: 'john@example.com', phone: '',
    });
    expect(component.form.invalid).toBeTrue();
  });

  it('on valid submit calls generate-code then POST /api/bookings with X-Idempotency-Key', () => {
    component.form.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '',
    });

    component.submit();

    const codeReq = httpMock.expectOne('/api/bookings/generate-code');
    expect(codeReq.request.method).toBe('GET');
    codeReq.flush({ bookingCode: 'AX3KF7AB' });

    const bookingReq = httpMock.expectOne('/api/bookings');
    expect(bookingReq.request.method).toBe('POST');
    expect(bookingReq.request.headers.get('X-Idempotency-Key')).toBe('AX3KF7AB');
    expect(bookingReq.request.body).toEqual({
      flightId: 'f1',
      seatNumber: '12A',
      totalAmount: 299.99,
      currency: 'USD',
      passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: null },
    });
    bookingReq.flush(bookingResponse);
  });

  it('calls service.setBooking on 201 response', () => {
    component.form.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '',
    });
    component.submit();

    httpMock.expectOne('/api/bookings/generate-code').flush({ bookingCode: 'AX3KF7AB' });
    httpMock.expectOne('/api/bookings').flush(bookingResponse, { status: 201, statusText: 'Created' });

    expect(flow.booking()).toEqual(bookingResponse);
  });
});
