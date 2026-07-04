import { Routes } from '@angular/router';
import { FlightSearchComponent } from './flight-search.component';
import { FlightResultsComponent } from './flight-results.component';

export const FLIGHTS_ROUTES: Routes = [
  { path: '',        component: FlightSearchComponent },
  { path: 'results', component: FlightResultsComponent },
];
