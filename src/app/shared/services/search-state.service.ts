import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  origin           = signal('LHR');
  originCity       = signal('London');
  originAirport    = signal('Heathrow');
  destination      = signal('');
  destinationCity  = signal('');
  destinationAirport = signal('');
  date             = signal('');

  setSearch(
    origin: string, originCity: string, originAirport: string,
    destination: string, destinationCity: string, destinationAirport: string,
    date: string,
  ): void {
    this.origin.set(origin);
    this.originCity.set(originCity);
    this.originAirport.set(originAirport);
    this.destination.set(destination);
    this.destinationCity.set(destinationCity);
    this.destinationAirport.set(destinationAirport);
    this.date.set(date);
  }
}
