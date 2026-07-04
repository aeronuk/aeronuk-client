import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingFlowService } from '../services/booking-flow.service';

export const paymentGuard: CanActivateFn = () => {
  const flow   = inject(BookingFlowService);
  const router = inject(Router);
  return flow.seat() !== null ? true : router.createUrlTree(['/booking/seats']);
};
