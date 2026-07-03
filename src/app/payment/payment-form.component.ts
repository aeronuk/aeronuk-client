// src/app/payment/payment-form.component.ts
import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Payment } from '../shared/models/payment.model';

type PaymentMethod = 'CREDIT_CARD' | 'PAYPAL' | 'APPLE_PAY' | 'PIX' | 'IDEAL';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './payment-form.component.html',
})
export class PaymentFormComponent implements OnInit {
  private http       = inject(HttpClient);
  protected flow       = inject(BookingFlowService);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly methods: PaymentMethod[] = ['CREDIT_CARD', 'PAYPAL', 'APPLE_PAY', 'PIX', 'IDEAL'];
  methodControl = new FormControl<PaymentMethod>('CREDIT_CARD', { nonNullable: true });
  detailsForm: FormGroup = new FormGroup({});

  submitting = signal(false);
  error      = signal<string | null>(null);

  ngOnInit(): void {
    this.buildDetailsForm(this.methodControl.value);
    this.methodControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(method => this.buildDetailsForm(method));
  }

  private buildDetailsForm(method: PaymentMethod): void {
    const controls: Record<string, AbstractControl> = {};
    switch (method) {
      case 'CREDIT_CARD':
        controls['cardNumber']  = new FormControl('', Validators.required);
        controls['expiryMonth'] = new FormControl('', Validators.required);
        controls['expiryYear']  = new FormControl('', Validators.required);
        break;
      case 'PAYPAL':
        controls['email'] = new FormControl('', [Validators.required, Validators.email]);
        break;
      case 'APPLE_PAY':
        controls['token'] = new FormControl('', Validators.required);
        break;
      case 'PIX':
        controls['pixKey'] = new FormControl('', Validators.required);
        break;
      case 'IDEAL':
        controls['bank'] = new FormControl('', Validators.required);
        break;
    }
    // Replace all controls
    Object.keys(this.detailsForm.controls).forEach(k => this.detailsForm.removeControl(k));
    Object.entries(controls).forEach(([k, c]) => this.detailsForm.addControl(k, c));
  }

  submit(): void {
    if (this.detailsForm.invalid) return;
    const booking = this.flow.booking()!;
    this.submitting.set(true);
    this.error.set(null);

    const body = {
      bookingCode: booking.bookingCode,
      method:      this.methodControl.value,
      details:     this.detailsForm.value,
    };

    this.http.post<Payment>('/api/payments', body).subscribe({
      next: payment => {
        this.flow.setPayment(payment);
        this.router.navigate(['/payment/receipt']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 402) {
          this.error.set('Payment declined — please try another method.');
        } else if (err.status === 404) {
          this.error.set('No pending booking found.');
        } else if (err.status === 409) {
          this.router.navigate(['/payment/receipt']);
        } else {
          this.error.set('Payment failed. Please try again.');
        }
        this.submitting.set(false);
      },
    });
  }
}
