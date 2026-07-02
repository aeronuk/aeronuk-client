// src/app/booking/booking-confirmation.component.ts
import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { HlmCardImports } from '../shared/ui/card';
import { HlmButtonImports } from '../shared/ui/button';
import { HlmBadgeImports } from '../shared/ui/badge';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ...HlmCardImports, ...HlmButtonImports, ...HlmBadgeImports],
  templateUrl: './booking-confirmation.component.html',
})
export class BookingConfirmationComponent implements OnInit {
  private router = inject(Router);
  flow = inject(BookingFlowService);

  ngOnInit(): void {
    if (!this.flow.booking()) this.router.navigate(['/booking']);
  }
}
