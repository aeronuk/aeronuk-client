import { Component, signal, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking } from '../shared/models/booking.model';

// Simple in-memory holder for the found booking (shared between component and result)
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MyTripsStateService {
  foundBooking = signal<Booking | null>(null);
}

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './my-trips.component.html',
  styleUrl: './my-trips.component.css',
})
export class MyTripsComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private state = inject(MyTripsStateService);

  searching = signal(false);
  error = signal<string | null>(null);

  form = new FormGroup({
    bookingCode: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
  });

  find(): void {
    if (this.form.invalid) return;
    this.searching.set(true);
    this.error.set(null);
    const { bookingCode, lastName } = this.form.value;
    const params = new HttpParams().set('lastName', lastName!);

    this.http.get<Booking>(`/api/bookings/${bookingCode}`, { params }).subscribe({
      next: booking => {
        this.state.foundBooking.set(booking);
        this.router.navigate(['/my-trips/result']);
      },
      error: (err: HttpErrorResponse) => {
        this.searching.set(false);
        if (err.status === 404) {
          this.error.set("We couldn't find a booking with that reference and last name. Please check and try again.");
        } else {
          this.error.set('Something went wrong. Please try again.');
        }
      },
    });
  }
}
