import { Component, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Booking } from '../shared/models/booking.model';
import { Payment } from '../shared/models/payment.model';

type Method = 'card' | 'paypal' | 'applepay';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
})
export class PaymentFormComponent {
  private http   = inject(HttpClient);
  protected flow   = inject(BookingFlowService);
  private router = inject(Router);

  method    = signal<Method>('card');
  submitted = signal(false);
  submitting = signal(false);
  error      = signal<string | null>(null);

  cardForm = new FormGroup({
    cardName:   new FormControl('', Validators.required),
    cardNumber: new FormControl('', Validators.required),
    expiry:     new FormControl('', Validators.required),
    cvc:        new FormControl('', Validators.required),
    address:    new FormControl('', Validators.required),
    city:       new FormControl('', Validators.required),
    postcode:   new FormControl('', Validators.required),
  });

  hasError(field: string): boolean {
    const c = this.cardForm.get(field);
    return this.submitted() && !!c && c.invalid;
  }

  selectMethod(m: Method): void {
    this.method.set(m);
    this.submitted.set(false);
    this.error.set(null);
  }

  submitCard(): void {
    this.submitted.set(true);
    if (this.cardForm.invalid) return;

    const flight  = this.flow.flight()!;
    const seat    = this.flow.seat()!;
    const draft   = this.flow.passengerDraft()!;
    const v       = this.cardForm.value;
    const [em, ey] = (v.expiry ?? '').split('/').map(s => s.trim());

    this.submitting.set(true);
    this.error.set(null);

    this.http.get<{ bookingCode: string }>('/api/bookings/generate-code').pipe(
      switchMap(({ bookingCode }) => {
        const headers = new HttpHeaders({ 'X-Idempotency-Key': bookingCode });
        const body = {
          flightId:    flight.id,
          seatNumber:  seat.seatNumber,
          totalAmount: flight.price.amount + 62,
          currency:    flight.price.currency || 'GBP',
          passenger: {
            firstName: draft.firstName,
            lastName:  draft.lastName,
            email:     draft.email,
            phone:     draft.mobile,
          },
        };
        return this.http.post<Booking>('/api/bookings', body, { headers });
      }),
      switchMap(booking => {
        this.flow.setBooking(booking);
        const payBody = {
          bookingCode: booking.bookingCode,
          method:      'CREDIT_CARD',
          details: {
            cardNumber:  v.cardNumber,
            expiryMonth: em,
            expiryYear:  ey,
            cvc:         v.cvc,
          },
        };
        return this.http.post<Payment>('/api/payments', payBody);
      }),
    ).subscribe({
      next: payment => {
        this.flow.setPayment(payment);
        this.router.navigate(['/booking/confirmation']);
      },
      error: () => {
        this.error.set('Payment failed. Please check your details and try again.');
        this.submitting.set(false);
      },
    });
  }

  submitAltMethod(): void {
    const flight = this.flow.flight();
    const seat   = this.flow.seat();
    const draft  = this.flow.passengerDraft();
    if (!flight || !seat || !draft) { this.router.navigate(['/booking/seats']); return; }

    this.submitting.set(true);
    this.http.get<{ bookingCode: string }>('/api/bookings/generate-code').pipe(
      switchMap(({ bookingCode }) => {
        const headers = new HttpHeaders({ 'X-Idempotency-Key': bookingCode });
        const body = {
          flightId:    flight.id,
          seatNumber:  seat.seatNumber,
          totalAmount: flight.price.amount + 62,
          currency:    flight.price.currency || 'GBP',
          passenger: { firstName: draft.firstName, lastName: draft.lastName, email: draft.email, phone: draft.mobile },
        };
        return this.http.post<Booking>('/api/bookings', body, { headers });
      }),
    ).subscribe({
      next: booking => { this.flow.setBooking(booking); this.router.navigate(['/booking/confirmation']); },
      error: () => { this.error.set('Something went wrong. Please try again.'); this.submitting.set(false); },
    });
  }

  protected readonly seatLabel = (() => this.flow.seat()?.seatNumber ?? '—');
  protected readonly seatPrice = (() => {
    const s = this.flow.seat();
    if (!s) return '£0';
    return s.class === 'extra' ? '£18' : '£8';
  });
  protected readonly total = (() => {
    const s = this.flow.seat();
    const seatCost = s ? (s.class === 'extra' ? 18 : 8) : 0;
    return `£${(this.flow.flight()?.price.amount ?? 389) + 62 + seatCost}`;
  });
}
