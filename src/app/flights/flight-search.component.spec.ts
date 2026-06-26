import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FlightSearchComponent } from './flight-search.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';

describe('FlightSearchComponent', () => {
  let fixture: ComponentFixture<FlightSearchComponent>;
  let component: FlightSearchComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightSearchComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        BookingFlowService,
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(FlightSearchComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('form is invalid when origin is missing', () => {
    component.form.patchValue({ origin: '', destination: 'LAX', date: '2024-01-15' });
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when destination is missing', () => {
    component.form.patchValue({ origin: 'JFK', destination: '', date: '2024-01-15' });
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when date is missing', () => {
    component.form.patchValue({ origin: 'JFK', destination: 'LAX', date: '' });
    expect(component.form.invalid).toBeTrue();
  });

  it('calls GET /api/flights with correct query params on valid submit', () => {
    component.form.patchValue({ origin: 'JFK', destination: 'LAX', date: '2024-01-15' });
    component.search();

    const req = httpMock.expectOne(
      r => r.url === '/api/flights' &&
           r.params.get('origin') === 'JFK' &&
           r.params.get('destination') === 'LAX' &&
           r.params.get('date') === '2024-01-15',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('populates results signal on successful response', () => {
    const mockFlight = {
      id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
      departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
      price: { amount: 299.99, currency: 'USD' },
    };
    component.form.patchValue({ origin: 'JFK', destination: 'LAX', date: '2024-01-15' });
    component.search();

    const req = httpMock.expectOne(r => r.url === '/api/flights');
    req.flush([mockFlight]);

    expect(component.results()).toEqual([mockFlight]);
  });
});
