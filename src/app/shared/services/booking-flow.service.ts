import { Injectable, signal } from '@angular/core';
import { Flight, Seat } from '../models/flight.model';
import { Booking } from '../models/booking.model';
import { Payment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class BookingFlowService {
  private _flight  = signal<Flight | null>(null);
  private _seat    = signal<Seat | null>(null);
  private _booking = signal<Booking | null>(null);
  private _payment = signal<Payment | null>(null);

  readonly flight  = this._flight.asReadonly();
  readonly seat    = this._seat.asReadonly();
  readonly booking = this._booking.asReadonly();
  readonly payment = this._payment.asReadonly();

  selectFlight(flight: Flight): void {
    this._flight.set(flight);
    this._seat.set(null);
    this._booking.set(null);
    this._payment.set(null);
  }

  selectSeat(seat: Seat): void { this._seat.set(seat); }

  setBooking(booking: Booking): void { this._booking.set(booking); }

  setPayment(payment: Payment): void { this._payment.set(payment); }

  reset(): void {
    this._flight.set(null);
    this._seat.set(null);
    this._booking.set(null);
    this._payment.set(null);
  }
}
