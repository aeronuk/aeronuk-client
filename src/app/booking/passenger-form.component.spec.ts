// src/app/booking/passenger-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PassengerFormComponent } from './passenger-form.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight, Seat } from '../shared/models/flight.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const seat: Seat = { id: 's1', seatNumber: '12A', class: 'ECONOMY', available: true };

const validValue = {
  title: 'Mr', firstName: 'John', lastName: 'Doe', dob: '1990-01-01',
  nationality: 'GB', email: 'john@example.com', mobile: '07700900000',
};

describe('PassengerFormComponent', () => {
  let fixture: ComponentFixture<PassengerFormComponent>;
  let component: PassengerFormComponent;
  let router: Router;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    flow = TestBed.inject(BookingFlowService);
    flow.selectFlight(flight);
    flow.selectSeat(seat);

    fixture   = TestBed.createComponent(PassengerFormComponent);
    component = fixture.componentInstance;
    router    = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('form is invalid when email is malformed', () => {
    component.form.patchValue({ ...validValue, email: 'not-an-email' });
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when firstName is missing', () => {
    component.form.patchValue({ ...validValue, firstName: '' });
    expect(component.form.invalid).toBeTrue();
  });

  it('submit() with an invalid form marks it submitted, shows errors, and does not navigate', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.submit();

    expect(component.submitted()).toBeTrue();
    expect(component.hasError('firstName')).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('on valid submit stores the passenger draft and navigates to /booking/seats', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.form.patchValue(validValue);

    component.submit();

    expect(flow.passengerDraft()).toEqual(validValue);
    expect(navigateSpy).toHaveBeenCalledWith(['/booking/seats']);
  });
});
