// src/app/booking/booking.routes.ts
import { Routes } from '@angular/router';
import { bookingGuard } from '../shared/guards/booking.guard';
import { SeatSelectionComponent } from './seat-selection.component';
import { PassengerFormComponent } from './passenger-form.component';
import { BookingConfirmationComponent } from './booking-confirmation.component';

export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [bookingGuard],
    children: [
      { path: '',             component: SeatSelectionComponent },
      { path: 'passenger',   component: PassengerFormComponent },
      { path: 'confirmation', component: BookingConfirmationComponent },
    ],
  },
];
