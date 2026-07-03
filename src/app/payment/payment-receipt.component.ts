// src/app/payment/payment-receipt.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Booking } from '../shared/models/booking.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-payment-receipt',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './payment-receipt.component.html',
})
export class PaymentReceiptComponent implements OnInit {
  private http       = inject(HttpClient);
  protected flow       = inject(BookingFlowService);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  resolvedBooking = signal<Booking | null>(null);
  timedOut        = signal(false);

  ngOnInit(): void {
    const booking = this.flow.booking();
    if (!booking) { this.router.navigate(['/payment']); return; }

    const stop$ = new Subject<void>();

    interval(2000).pipe(
      takeUntilDestroyed(this.destroyRef),
      takeUntil(stop$),
      switchMap(() => {
        const params = new HttpParams().set('lastName', booking.passenger.lastName);
        return this.http.get<Booking>(`/api/bookings/${booking.bookingCode}`, { params });
      }),
    ).subscribe(b => {
      if (b.status === 'CONFIRMED' || b.status === 'PAYMENT_FAILED') {
        this.resolvedBooking.set(b);
        stop$.next();
      }
    });

    timer(30000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.resolvedBooking()) {
        this.timedOut.set(true);
        stop$.next();
      }
    });
  }

  restart(): void {
    this.flow.reset();
    this.router.navigate(['/flights']);
  }
}
