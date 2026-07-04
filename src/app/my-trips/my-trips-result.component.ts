import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MyTripsStateService } from './my-trips.component';

@Component({
  selector: 'app-my-trips-result',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-trips-result.component.html',
})
export class MyTripsResultComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(MyTripsStateService);

  ngOnInit(): void {
    if (!this.state.foundBooking()) this.router.navigate(['/my-trips']);
  }
}
