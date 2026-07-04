import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingFlowService } from '../shared/services/booking-flow.service';

interface FareDef {
  name: string;
  price: string;
  tag?: string;
  features: string[];
}

@Component({
  selector: 'app-flight-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './flight-details.component.html',
})
export class FlightDetailsComponent {
  protected flow   = inject(BookingFlowService);
  private router = inject(Router);

  readonly fareDefs: FareDef[] = [
    { name: 'Economy Saver', price: '£389', features: ['1 cabin bag (7kg)', 'Seat from £8', 'Snack included'] },
    { name: 'Economy Flex',  price: '£469', tag: 'Most popular', features: ['1 cabin + 23kg checked', 'Free date changes', 'Priority boarding'] },
    { name: 'Business',      price: '£1,240', features: ['Lie-flat seat', 'Lounge access', '2 × 32kg checked'] },
  ];

  selectedFare = signal(this.flow.fare() || 'Economy Saver');

  selectFare(name: string): void {
    this.selectedFare.set(name);
  }

  continue(): void {
    this.flow.setFare(this.selectedFare());
    this.router.navigate(['/booking/passenger']);
  }

  formatTime(iso: string): string {
    try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }); }
    catch { return iso; }
  }

  protected readonly selectedFarePrice = computed(() =>
    this.fareDefs.find(f => f.name === this.selectedFare())?.price ?? '£389');
}
