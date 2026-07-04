import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingFlowService } from '../shared/services/booking-flow.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './booking-confirmation.component.html',
})
export class BookingConfirmationComponent {
  protected flow   = inject(BookingFlowService);
  private router = inject(Router);

  bookNew(): void {
    this.flow.reset();
    this.router.navigate(['/flights']);
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}
