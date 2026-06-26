import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'flights',
    loadChildren: () =>
      import('./flights/flights.routes').then(m => m.FLIGHTS_ROUTES),
  },
  {
    path: 'booking',
    loadChildren: () =>
      import('./booking/booking.routes').then(m => m.BOOKING_ROUTES),
  },
  {
    path: 'payment',
    loadChildren: () =>
      import('./payment/payment.routes').then(m => m.PAYMENT_ROUTES),
  },
  { path: '', redirectTo: 'flights', pathMatch: 'full' },
];
