// src/app/booking/passenger-form.component.ts
import { Component, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Booking } from '../shared/models/booking.model';
import { HlmCardImports } from '../shared/ui/card';
import { HlmButtonImports } from '../shared/ui/button';
import { HlmInputImports } from '../shared/ui/input';
import { HlmLabelImports } from '../shared/ui/label';

@Component({
  selector: 'app-passenger-form',
  standalone: true,
  imports: [ReactiveFormsModule, ...HlmCardImports, ...HlmButtonImports, ...HlmInputImports, ...HlmLabelImports],
  templateUrl: './passenger-form.component.html',
})
export class PassengerFormComponent {
  private http   = inject(HttpClient);
  private flow   = inject(BookingFlowService);
  private router = inject(Router);

  submitting = signal(false);
  error      = signal<string | null>(null);

  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName:  new FormControl('', Validators.required),
    email:     new FormControl('', [Validators.required, Validators.email]),
    phone:     new FormControl(''),
  });

  submit(): void {
    if (this.form.invalid) return;
    const flight = this.flow.flight()!;
    const seat   = this.flow.seat()!;
    const { firstName, lastName, email, phone } = this.form.value;

    this.submitting.set(true);
    this.error.set(null);

    this.http.get<{ bookingCode: string }>('/api/bookings/generate-code').pipe(
      switchMap(({ bookingCode }) => {
        const headers = new HttpHeaders({ 'X-Idempotency-Key': bookingCode });
        const body = {
          flightId:    flight.id,
          seatNumber:  seat.seatNumber,
          totalAmount: flight.price.amount,
          currency:    flight.price.currency,
          passenger: {
            firstName: firstName!,
            lastName:  lastName!,
            email:     email!,
            phone:     phone || null,
          },
        };
        return this.http.post<Booking>('/api/bookings', body, { headers });
      }),
    ).subscribe({
      next: booking => {
        this.flow.setBooking(booking);
        this.router.navigate(['/booking/confirmation']);
      },
      error: () => {
        this.error.set('Booking failed. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
