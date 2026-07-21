import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SearchStateService } from '../shared/services/search-state.service';

interface Destination {
  city: string;
  code: string;
  airport: string;
  price: string;
  imageLabel: string;
}

@Component({
  selector: 'app-all-destinations',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './all-destinations.component.html',
  styleUrl: './all-destinations.component.css',
})
export class AllDestinationsComponent {
  private router = inject(Router);
  private searchState = inject(SearchStateService);

  readonly allDestinations: Destination[] = [
    { city: 'Barcelona', code: 'BCN', airport: 'El Prat',            price: '£78',  imageLabel: 'city / beach photo' },
    { city: 'Reykjavík', code: 'KEF', airport: 'Keflavík Intl.',     price: '£120', imageLabel: 'landscape photo' },
    { city: 'Dubai',     code: 'DXB', airport: 'Intl.',               price: '£340', imageLabel: 'skyline photo' },
    { city: 'Tokyo',     code: 'HND', airport: 'Haneda',              price: '£520', imageLabel: 'street photo' },
    { city: 'Lisbon',    code: 'LIS', airport: 'Humberto Delgado',   price: '£65',  imageLabel: 'coastal photo' },
    { city: 'Rome',      code: 'FCO', airport: 'Fiumicino',           price: '£95',  imageLabel: 'landmark photo' },
    { city: 'New York',  code: 'JFK', airport: 'John F. Kennedy',     price: '£344', imageLabel: 'skyline photo' },
    { city: 'Singapore', code: 'SIN', airport: 'Changi',              price: '£610', imageLabel: 'skyline photo' },
    { city: 'Cape Town', code: 'CPT', airport: 'Intl.',               price: '£480', imageLabel: 'coastal photo' },
    { city: 'Sydney',    code: 'SYD', airport: 'Kingsford Smith',     price: '£720', imageLabel: 'harbour photo' },
    { city: 'Marrakech', code: 'RAK', airport: 'Menara',              price: '£110', imageLabel: 'market photo' },
    { city: 'Vancouver', code: 'YVR', airport: 'Intl.',               price: '£410', imageLabel: 'mountain photo' },
  ];

  select(dest: Destination): void {
    this.searchState.setSearch(
      'LHR', 'London', 'Heathrow',
      dest.code, dest.city, dest.airport,
      '',
    );
    this.router.navigate(['/flights/results'], {
      queryParams: { origin: 'LHR', destination: dest.code, date: '' },
    });
  }
}
