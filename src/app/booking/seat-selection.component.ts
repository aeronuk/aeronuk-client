import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Seat } from '../shared/models/flight.model';

interface SeatCell {
  id: string;
  col: string;
  occupied: boolean;
  extra: boolean;
  selected: boolean;
}

interface SeatRow {
  num: number;
  left: SeatCell[];
  right: SeatCell[];
}

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css',
})
export class SeatSelectionComponent {
  protected flow   = inject(BookingFlowService);
  private router = inject(Router);

  private readonly TAKEN = new Set([
    '9A','9B','11E','12C','13F','14A','15B','15C','16D','18E',
    '19A','19F','21B','22C','8F','10D','17A','20E',
  ]);

  selectedSeat = signal<string | null>(null);

  readonly seatRows = computed<SeatRow[]>(() => {
    const cols = ['A','B','C','D','E','F'];
    const sel = this.selectedSeat();
    const rows: SeatRow[] = [];
    for (let n = 8; n <= 22; n++) {
      const extra = n === 8 || n === 9;
      const cells: SeatCell[] = cols.map(c => ({
        id: `${n}${c}`,
        col: c,
        occupied: this.TAKEN.has(`${n}${c}`),
        extra,
        selected: sel === `${n}${c}`,
      }));
      rows.push({ num: n, left: cells.slice(0, 3), right: cells.slice(3) });
    }
    return rows;
  });

  getSeatClass(seat: SeatCell): string {
    if (seat.selected) return 'seat-btn seat-btn--selected';
    if (seat.occupied) return 'seat-btn seat-btn--occupied';
    if (seat.extra)    return 'seat-btn seat-btn--extra';
    return 'seat-btn seat-btn--standard';
  }

  selectSeat(seat: SeatCell): void {
    if (seat.occupied) return;
    this.selectedSeat.set(seat.selected ? null : seat.id);
  }

  protected readonly seatMeta = computed(() => {
    const s = this.selectedSeat();
    if (!s) return { label: '—', desc: 'Tap a seat to choose', price: '£0', isExtra: false };
    const row = parseInt(s, 10);
    const col = s.replace(/[0-9]/g, '');
    const isExtra = row === 8 || row === 9;
    const isWindow = col === 'A' || col === 'F';
    const isAisle  = col === 'C' || col === 'D';
    const kind = isWindow ? 'Window' : isAisle ? 'Aisle' : 'Middle';
    return {
      label:   s,
      desc:    (isExtra ? 'Extra legroom · ' : '') + kind + ' seat',
      price:   isExtra ? '£18' : '£8',
      isExtra,
    };
  });

  protected readonly seatTotal = computed(() => {
    const meta = this.seatMeta();
    const seatCost = meta.isExtra ? 18 : (this.selectedSeat() ? 8 : 0);
    return `£${389 + 62 + seatCost}`;
  });

  continue(): void {
    const s = this.selectedSeat();
    const meta = this.seatMeta();
    const seat: Seat = {
      id: s ?? 'none',
      seatNumber: s ?? '14C',
      class: meta.isExtra ? 'extra' : 'economy',
      available: true,
    };
    this.flow.selectSeat(seat);
    this.router.navigate(['/payment']);
  }
}
