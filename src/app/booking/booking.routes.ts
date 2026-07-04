import { Routes } from '@angular/router';
import { bookingGuard } from '../shared/guards/booking.guard';
import { FlightDetailsComponent } from './flight-details.component';
import { PassengerFormComponent } from './passenger-form.component';
import { SeatSelectionComponent } from './seat-selection.component';
import { BookingConfirmationComponent } from './booking-confirmation.component';

export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [bookingGuard],
    children: [
      { path: '',              component: FlightDetailsComponent },
      { path: 'passenger',    component: PassengerFormComponent },
      { path: 'seats',        component: SeatSelectionComponent },
      { path: 'confirmation', component: BookingConfirmationComponent },
    ],
  },
];
