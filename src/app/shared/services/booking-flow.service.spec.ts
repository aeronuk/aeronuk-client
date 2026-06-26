import { TestBed } from '@angular/core/testing';
import { BookingFlowService } from './booking-flow.service';
import { Flight, Seat } from '../models/flight.model';
import { Booking } from '../models/booking.model';
import { Payment } from '../models/payment.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const seat: Seat = { id: 's1', seatNumber: '12A', class: 'ECONOMY', available: true };
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

describe('BookingFlowService', () => {
  let service: BookingFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingFlowService);
  });

  it('has null initial state', () => {
    expect(service.flight()).toBeNull();
    expect(service.seat()).toBeNull();
    expect(service.booking()).toBeNull();
    expect(service.payment()).toBeNull();
  });

  it('selectFlight sets flight and clears downstream state', () => {
    service.selectSeat(seat);
    service.selectFlight(flight);
    expect(service.flight()).toEqual(flight);
    expect(service.seat()).toBeNull();
    expect(service.booking()).toBeNull();
    expect(service.payment()).toBeNull();
  });

  it('selectSeat sets seat without clearing flight', () => {
    service.selectFlight(flight);
    service.selectSeat(seat);
    expect(service.flight()).toEqual(flight);
    expect(service.seat()).toEqual(seat);
  });

  it('setBooking sets booking without clearing flight or seat', () => {
    service.selectFlight(flight);
    service.selectSeat(seat);
    service.setBooking(booking);
    expect(service.flight()).toEqual(flight);
    expect(service.seat()).toEqual(seat);
    expect(service.booking()).toEqual(booking);
  });

  it('reset clears all signals', () => {
    service.selectFlight(flight);
    service.selectSeat(seat);
    service.setBooking(booking);
    service.setPayment(payment);
    service.reset();
    expect(service.flight()).toBeNull();
    expect(service.seat()).toBeNull();
    expect(service.booking()).toBeNull();
    expect(service.payment()).toBeNull();
  });
});
