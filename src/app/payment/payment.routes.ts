// src/app/payment/payment.routes.ts
import { Routes } from '@angular/router';
import { paymentGuard } from '../shared/guards/payment.guard';
import { PaymentFormComponent } from './payment-form.component';
import { PaymentReceiptComponent } from './payment-receipt.component';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [paymentGuard],
    children: [
      { path: '',        component: PaymentFormComponent },
      { path: 'receipt', component: PaymentReceiptComponent },
    ],
  },
];
