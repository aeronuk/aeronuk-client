import { Routes } from '@angular/router';
import { paymentGuard } from '../shared/guards/payment.guard';
import { PaymentFormComponent } from './payment-form.component';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [paymentGuard],
    children: [
      { path: '', component: PaymentFormComponent },
    ],
  },
];
