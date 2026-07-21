import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { FlightResultsComponent } from './flight-results.component';
import { SearchStateService } from '../shared/services/search-state.service';
import { Flight } from '../shared/models/flight.model';

const flights: Flight[] = [
  {
    id: 'f1', flightNumber: 'AX001', origin: 'LHR', destination: 'JFK',
    departureTime: '2025-08-01T10:00:00Z', arrivalTime: '2025-08-01T13:00:00Z',
    price: { amount: 389, currency: 'GBP' },
  },
];

/** Builds an ActivatedRoute stub whose snapshot exposes the given query params. */
function activatedRouteWithQueryParams(queryParams: Record<string, string>) {
  return {
    snapshot: { queryParamMap: convertToParamMap(queryParams) },
  };
}

describe('FlightResultsComponent', () => {
  let fixture: ComponentFixture<FlightResultsComponent>;
  let component: FlightResultsComponent;
  let httpMock: HttpTestingController;
  let searchState: SearchStateService;

  async function setup(queryParams: Record<string, string>): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [FlightResultsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteWithQueryParams(queryParams) },
      ],
    }).compileComponents();

    searchState = TestBed.inject(SearchStateService);
    fixture     = TestBed.createComponent(FlightResultsComponent);
    component   = fixture.componentInstance;
    httpMock    = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock.verify());

  it('reads origin, destination and date from query params on load and populates SearchStateService', async () => {
    await setup({ origin: 'JFK', destination: 'LAX', date: '2025-09-10' });

    fixture.detectChanges();

    expect(searchState.origin()).toBe('JFK');
    expect(searchState.destination()).toBe('LAX');
    expect(searchState.date()).toBe('2025-09-10');

    const req = httpMock.expectOne(r =>
      r.url === '/api/flights'
      && r.params.get('origin') === 'JFK'
      && r.params.get('destination') === 'LAX'
      && r.params.get('date') === '2025-09-10',
    );
    req.flush(flights);

    expect(component.screen()).toBe('results');
  });

  it('opening the results page directly with query params works without visiting the search form first', async () => {
    // No prior navigation through the search form means SearchStateService
    // still holds its untouched defaults -- the query params alone should
    // be enough to drive the search.
    await setup({ origin: 'SFO', destination: 'NRT', date: '2025-10-05' });
    expect(searchState.destination()).toBe('');

    fixture.detectChanges();

    expect(searchState.origin()).toBe('SFO');
    expect(searchState.destination()).toBe('NRT');
    expect(searchState.date()).toBe('2025-10-05');

    httpMock.expectOne(r => r.params.get('origin') === 'SFO').flush(flights);
  });

  it('falls back to the existing SearchStateService state when no query params are present', async () => {
    await setup({});

    searchState.setSearch('ORD', 'Chicago', "O'Hare Intl.", 'LAX', 'Los Angeles', 'Los Angeles Intl.', '2025-11-20');

    fixture.detectChanges();

    expect(searchState.origin()).toBe('ORD');
    expect(searchState.destination()).toBe('LAX');
    expect(searchState.date()).toBe('2025-11-20');

    const req = httpMock.expectOne(r =>
      r.params.get('origin') === 'ORD'
      && r.params.get('destination') === 'LAX'
      && r.params.get('date') === '2025-11-20',
    );
    req.flush(flights);
  });

  it('preserves the search across a browser refresh (fresh component instance, same query params)', async () => {
    await setup({ origin: 'LHR', destination: 'DXB', date: '2025-12-01' });
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('origin') === 'LHR').flush(flights);

    // Simulate a browser refresh: a brand-new component instance is created
    // against the same URL/query params, with no in-memory state carried
    // over other than what the URL itself encodes.
    await setup({ origin: 'LHR', destination: 'DXB', date: '2025-12-01' });
    fixture.detectChanges();

    expect(searchState.origin()).toBe('LHR');
    expect(searchState.destination()).toBe('DXB');
    expect(searchState.date()).toBe('2025-12-01');

    httpMock.expectOne(r => r.params.get('origin') === 'LHR').flush(flights);
  });

  it('?preview=no-results still shows the no-results screen without an API call', async () => {
    await setup({ preview: 'no-results' });

    fixture.detectChanges();

    expect(component.screen()).toBe('no-results');
    httpMock.expectNone('/api/flights');
  });

  it('?preview=error still shows the error screen without an API call', async () => {
    await setup({ preview: 'error' });

    fixture.detectChanges();

    expect(component.screen()).toBe('error');
    httpMock.expectNone('/api/flights');
  });
});
