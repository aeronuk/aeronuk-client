import { Routes } from '@angular/router';
import { MyTripsComponent } from './my-trips.component';
import { MyTripsResultComponent } from './my-trips-result.component';

export const MY_TRIPS_ROUTES: Routes = [
  { path: '', component: MyTripsComponent },
  { path: 'result', component: MyTripsResultComponent },
];
