// src/app/booking/seat-selection.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Seat } from '../shared/models/flight.model';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [],
  templateUrl: './seat-selection.component.html',
})
export class SeatSelectionComponent implements OnInit {
  private http   = inject(HttpClient);
  private flow   = inject(BookingFlowService);
  private router = inject(Router);

  seats   = signal<Seat[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);

  ngOnInit(): void {
    const flight = this.flow.flight();
    if (!flight) { this.router.navigate(['/flights']); return; }

    this.http.get<Seat[]>(`/api/flights/${flight.id}/seats`).subscribe({
      next: seats => { this.seats.set(seats); this.loading.set(false); },
      error: ()   => { this.error.set('Could not load seats.'); this.loading.set(false); },
    });
  }

  select(seat: Seat): void {
    if (!seat.available) return;
    this.flow.selectSeat(seat);
    this.router.navigate(['/booking/passenger']);
  }

  getSeatClasses(seat: Seat): string {
    if (!seat.available) return 'bg-[#E4E9F2] text-[#B4BECE] cursor-not-allowed';
    if (seat.class === 'business') return 'bg-[#DDF0E8] border border-[#9FD8BF] text-[#1F9D6B] hover:border-[#1F9D6B]';
    return 'bg-[#EAF3FD] border border-[#BBD8F5] text-[#2180E0] hover:border-[#2180E0]';
  }
}
