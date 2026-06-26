import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingFlowService } from '../services/booking-flow.service';

export const bookingGuard: CanActivateFn = () => {
  const flow   = inject(BookingFlowService);
  const router = inject(Router);
  return flow.flight() !== null ? true : router.createUrlTree(['/flights']);
};
