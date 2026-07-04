import { Injectable, signal } from '@angular/core';
import { Flight, Seat } from '../models/flight.model';
import { Booking, PassengerDraft } from '../models/booking.model';
import { Payment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class BookingFlowService {
  private _flight          = signal<Flight | null>(null);
  private _seat            = signal<Seat | null>(null);
  private _booking         = signal<Booking | null>(null);
  private _payment         = signal<Payment | null>(null);
  private _fare            = signal<string>('Economy Saver');
  private _passengerDraft  = signal<PassengerDraft | null>(null);

  readonly flight          = this._flight.asReadonly();
  readonly seat            = this._seat.asReadonly();
  readonly booking         = this._booking.asReadonly();
  readonly payment         = this._payment.asReadonly();
  readonly fare            = this._fare.asReadonly();
  readonly passengerDraft  = this._passengerDraft.asReadonly();

  selectFlight(flight: Flight): void {
    this._flight.set(flight);
    this._seat.set(null);
    this._booking.set(null);
    this._payment.set(null);
    this._passengerDraft.set(null);
    this._fare.set('Economy Saver');
  }

  selectSeat(seat: Seat): void { this._seat.set(seat); }

  setBooking(booking: Booking): void { this._booking.set(booking); }

  setPayment(payment: Payment): void { this._payment.set(payment); }

  setFare(fare: string): void { this._fare.set(fare); }

  setPassengerDraft(draft: PassengerDraft): void { this._passengerDraft.set(draft); }

  reset(): void {
    this._flight.set(null);
    this._seat.set(null);
    this._booking.set(null);
    this._payment.set(null);
    this._fare.set('Economy Saver');
    this._passengerDraft.set(null);
  }
}
