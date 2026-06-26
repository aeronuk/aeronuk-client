// src/app/booking/booking-confirmation.component.ts
import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { BookingFlowService } from '../shared/services/booking-flow.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './booking-confirmation.component.html',
})
export class BookingConfirmationComponent {
  private router = inject(Router);
  flow = inject(BookingFlowService);

  ngOnInit(): void {
    if (!this.flow.booking()) this.router.navigate(['/booking']);
  }
}
