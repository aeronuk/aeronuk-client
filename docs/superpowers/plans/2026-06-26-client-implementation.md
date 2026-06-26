# aeronuk-client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Node.js placeholder with a fully working Angular 20 SPA that drives the flight-search → seat-selection → booking → payment wizard.

**Architecture:** Four lazy-loaded feature domains (flights, booking, payment, shared) using Angular 20 standalone components and signal-based state. A singleton `BookingFlowService` carries wizard selections between routes. The app calls relative `/api/*` paths; nginx in aeronuk-ops routes to the correct backend.

**Tech Stack:** Angular 20, Angular Reactive Forms, Angular signals, signal inputs, RxJS, Jasmine + Karma, nginx:alpine (production container), Node 22 Alpine (build stage).

## Global Constraints

- Angular 20 patterns: standalone components (`standalone: true`), `bootstrapApplication`, `inject()`, signals, signal inputs (`input()`), functional guards (`CanActivateFn`), `provideHttpClient(withInterceptors([...]))`, `provideRouter(routes)`
- No NgModule classes anywhere
- `BookingFlowService` uses `@Injectable({ providedIn: 'root' })` — single instance for app lifetime
- All HTTP calls use relative paths (`/api/...`) — no hardcoded host
- Polling interval: 2000 ms; timeout: 30 000 ms
- Payment methods: `CREDIT_CARD`, `PAYPAL`, `APPLE_PAY`, `PIX`, `IDEAL`
- Airport codes for dropdowns: `JFK`, `LAX`, `ORD`, `SFO`, `LHR`, `NRT`
- Auth guards are structural no-ops: `() => true`
- Test runner: Jasmine + Karma, headless Chrome (`--browsers=ChromeHeadless`)
- `provideHttpClientTesting()` (not `HttpClientTestingModule`) for all HTTP tests
- No Co-Authored-By trailers in any commit

---

## File Map

```
aeronuk-client/
├── src/
│   ├── main.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── app.component.ts
│   ├── app.component.html
│   ├── shared/
│   │   ├── models/
│   │   │   ├── flight.model.ts
│   │   │   ├── booking.model.ts
│   │   │   └── payment.model.ts
│   │   ├── services/
│   │   │   ├── booking-flow.service.ts
│   │   │   └── booking-flow.service.spec.ts
│   │   ├── guards/
│   │   │   ├── booking.guard.ts
│   │   │   ├── booking.guard.spec.ts
│   │   │   ├── payment.guard.ts
│   │   │   └── payment.guard.spec.ts
│   │   └── interceptors/
│   │       └── api.interceptor.ts
│   ├── flights/
│   │   ├── flights.routes.ts
│   │   ├── flight-search.component.ts
│   │   ├── flight-search.component.html
│   │   ├── flight-search.component.spec.ts
│   │   ├── flight-results.component.ts
│   │   └── flight-results.component.html
│   ├── booking/
│   │   ├── booking.routes.ts
│   │   ├── seat-selection.component.ts
│   │   ├── seat-selection.component.html
│   │   ├── passenger-form.component.ts
│   │   ├── passenger-form.component.html
│   │   ├── passenger-form.component.spec.ts
│   │   ├── booking-confirmation.component.ts
│   │   └── booking-confirmation.component.html
│   └── payment/
│       ├── payment.routes.ts
│       ├── payment-form.component.ts
│       ├── payment-form.component.html
│       ├── payment-form.component.spec.ts
│       ├── payment-receipt.component.ts
│       ├── payment-receipt.component.html
│       └── payment-receipt.component.spec.ts
├── proxy.conf.json
├── nginx.conf
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Task 1: Angular scaffold + app shell + models

**Files:**
- Delete: `src/index.js`
- Create (via `ng new`): `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `karma.conf.js`, `src/index.html`, `src/styles.css`, `src/main.ts`, `src/app.config.ts`, `src/app.routes.ts`, `src/app.component.ts`, `src/app.component.html`
- Create: `src/shared/models/flight.model.ts`
- Create: `src/shared/models/booking.model.ts`
- Create: `src/shared/models/payment.model.ts`
- Modify: `src/app.routes.ts` (lazy routes)
- Modify: `src/app.component.ts` (shell with nav)
- Modify: `src/app.component.html`
- Modify: `src/app.config.ts` (add HttpClient)
- Create: `proxy.conf.json`
- Modify: `angular.json` (add proxyConfig)

**Interfaces:**
- Produces: `Flight`, `Seat`, `Booking`, `Passenger`, `Payment`, `PaymentAttempt` interfaces used by every later task

- [ ] **Step 1: Remove old stub and scaffold Angular 20**

```bash
cd /path/to/aeronuk-client
rm src/index.js
npx -p @angular/cli@20 ng new aeronuk-client --directory . --style=css --skip-git --skip-tests --ssr=false
```

Expected: Angular generates `package.json`, `angular.json`, `src/main.ts`, `src/app/`, etc. Accept any prompts with defaults. If asked about existing files, overwrite `.gitignore` (the Angular one is better) but keep `.env.example`.

After generation the project structure under `src/` uses `src/app/` by default. We will keep that layout — our feature folders go inside `src/app/`.

- [ ] **Step 2: Verify the generated project builds**

```bash
npm run build
```

Expected: `Build at: dist/aeronuk-client/browser — complete.` (no errors)

- [ ] **Step 3: Replace `src/app/app.routes.ts` with lazy feature routes**

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'flights',
    loadChildren: () =>
      import('./flights/flights.routes').then(m => m.FLIGHTS_ROUTES),
  },
  {
    path: 'booking',
    loadChildren: () =>
      import('./booking/booking.routes').then(m => m.BOOKING_ROUTES),
  },
  {
    path: 'payment',
    loadChildren: () =>
      import('./payment/payment.routes').then(m => m.PAYMENT_ROUTES),
  },
  { path: '', redirectTo: 'flights', pathMatch: 'full' },
];
```

- [ ] **Step 4: Update `src/app/app.config.ts` to add HttpClient**

```ts
// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { apiInterceptor } from './shared/interceptors/api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
  ],
};
```

The `apiInterceptor` doesn't exist yet — create a stub now so the app compiles:

```ts
// src/app/shared/interceptors/api.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (req, next) => next(req);
```

- [ ] **Step 5: Replace `src/app/app.component.ts` with the shell**

```ts
// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

```html
<!-- src/app/app.component.html -->
<nav>
  <a routerLink="/flights">Search Flights</a>
</nav>
<router-outlet />
```

- [ ] **Step 6: Create stub route files so the lazy imports resolve**

These stubs let the app compile before features are built. They will be replaced in Tasks 3–5.

```ts
// src/app/flights/flights.routes.ts
import { Routes } from '@angular/router';
export const FLIGHTS_ROUTES: Routes = [];
```

```ts
// src/app/booking/booking.routes.ts
import { Routes } from '@angular/router';
export const BOOKING_ROUTES: Routes = [];
```

```ts
// src/app/payment/payment.routes.ts
import { Routes } from '@angular/router';
export const PAYMENT_ROUTES: Routes = [];
```

- [ ] **Step 7: Create all TypeScript model interfaces**

```ts
// src/app/shared/models/flight.model.ts
export interface Flight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: { amount: number; currency: string };
}

export interface Seat {
  id: string;
  seatNumber: string;
  class: string;
  available: boolean;
}
```

```ts
// src/app/shared/models/booking.model.ts
export interface Passenger {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Booking {
  bookingCode: string;
  flightId: string;
  seatNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  passenger: Passenger;
  createdAt: string;
}
```

```ts
// src/app/shared/models/payment.model.ts
export interface PaymentAttempt {
  id: string;
  method: string;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingCode: string;
  amount: number;
  currency: string;
  status: string;
  attempts: PaymentAttempt[];
  createdAt: string;
}
```

- [ ] **Step 8: Create `proxy.conf.json`**

```json
{
  "/api": {
    "target": "http://localhost:80",
    "secure": false
  }
}
```

- [ ] **Step 9: Add proxyConfig to `angular.json`**

In `angular.json`, find the `serve` target for `aeronuk-client` and add `proxyConfig`:

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "configurations": {
    "production": { "buildTarget": "aeronuk-client:build:production" },
    "development": { "buildTarget": "aeronuk-client:build:development" }
  },
  "defaultConfiguration": "development",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

- [ ] **Step 10: Verify the project builds cleanly**

```bash
npm run build
```

Expected: `Build at: dist/aeronuk-client/browser — complete.` (no errors)

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Angular 20 app with models, shell, and lazy route stubs"
```

---

## Task 2: BookingFlowService + guards + interceptor

**Files:**
- Create: `src/app/shared/services/booking-flow.service.ts`
- Create: `src/app/shared/services/booking-flow.service.spec.ts`
- Create: `src/app/shared/guards/booking.guard.ts`
- Create: `src/app/shared/guards/booking.guard.spec.ts`
- Create: `src/app/shared/guards/payment.guard.ts`
- Create: `src/app/shared/guards/payment.guard.spec.ts`
- Modify: `src/app/shared/interceptors/api.interceptor.ts` (already a stub — no change needed)

**Interfaces:**
- Consumes: `Flight`, `Seat`, `Booking`, `Payment` from Task 1
- Produces:
  - `BookingFlowService` with signals `flight()`, `seat()`, `booking()`, `payment()` and methods `selectFlight(f)`, `selectSeat(s)`, `setBooking(b)`, `setPayment(p)`, `reset()`
  - `bookingGuard: CanActivateFn`
  - `paymentGuard: CanActivateFn`
  - `apiInterceptor: HttpInterceptorFn` (already stubbed)

- [ ] **Step 1: Write the failing `BookingFlowService` tests**

```ts
// src/app/shared/services/booking-flow.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { BookingFlowService } from './booking-flow.service';
import { Flight, Seat } from '../models/flight.model';
import { Booking } from '../models/booking.model';
import { Payment } from '../models/payment.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const seat: Seat = { id: 's1', seatNumber: '12A', class: 'ECONOMY', available: true };
const booking: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};
const payment: Payment = {
  id: 'p1', bookingCode: 'AX3KF7AB', amount: 299.99, currency: 'USD',
  status: 'SUCCESS', attempts: [], createdAt: '2024-01-15T10:01:00Z',
};

describe('BookingFlowService', () => {
  let service: BookingFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingFlowService);
  });

  it('has null initial state', () => {
    expect(service.flight()).toBeNull();
    expect(service.seat()).toBeNull();
    expect(service.booking()).toBeNull();
    expect(service.payment()).toBeNull();
  });

  it('selectFlight sets flight and clears downstream state', () => {
    service.selectSeat(seat);
    service.selectFlight(flight);
    expect(service.flight()).toEqual(flight);
    expect(service.seat()).toBeNull();
    expect(service.booking()).toBeNull();
    expect(service.payment()).toBeNull();
  });

  it('selectSeat sets seat without clearing flight', () => {
    service.selectFlight(flight);
    service.selectSeat(seat);
    expect(service.flight()).toEqual(flight);
    expect(service.seat()).toEqual(seat);
  });

  it('setBooking sets booking without clearing flight or seat', () => {
    service.selectFlight(flight);
    service.selectSeat(seat);
    service.setBooking(booking);
    expect(service.flight()).toEqual(flight);
    expect(service.seat()).toEqual(seat);
    expect(service.booking()).toEqual(booking);
  });

  it('reset clears all signals', () => {
    service.selectFlight(flight);
    service.selectSeat(seat);
    service.setBooking(booking);
    service.setPayment(payment);
    service.reset();
    expect(service.flight()).toBeNull();
    expect(service.seat()).toBeNull();
    expect(service.booking()).toBeNull();
    expect(service.payment()).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/shared/services/booking-flow.service.spec.ts
```

Expected: FAILED — `BookingFlowService` not found.

- [ ] **Step 3: Implement `BookingFlowService`**

```ts
// src/app/shared/services/booking-flow.service.ts
import { Injectable, signal } from '@angular/core';
import { Flight, Seat } from '../models/flight.model';
import { Booking } from '../models/booking.model';
import { Payment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class BookingFlowService {
  private _flight  = signal<Flight | null>(null);
  private _seat    = signal<Seat | null>(null);
  private _booking = signal<Booking | null>(null);
  private _payment = signal<Payment | null>(null);

  readonly flight  = this._flight.asReadonly();
  readonly seat    = this._seat.asReadonly();
  readonly booking = this._booking.asReadonly();
  readonly payment = this._payment.asReadonly();

  selectFlight(flight: Flight): void {
    this._flight.set(flight);
    this._seat.set(null);
    this._booking.set(null);
    this._payment.set(null);
  }

  selectSeat(seat: Seat): void { this._seat.set(seat); }

  setBooking(booking: Booking): void { this._booking.set(booking); }

  setPayment(payment: Payment): void { this._payment.set(payment); }

  reset(): void {
    this._flight.set(null);
    this._seat.set(null);
    this._booking.set(null);
    this._payment.set(null);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/shared/services/booking-flow.service.spec.ts
```

Expected: `5 specs, 0 failures`

- [ ] **Step 5: Write the failing guard tests**

```ts
// src/app/shared/guards/booking.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { bookingGuard } from './booking.guard';
import { BookingFlowService } from '../services/booking-flow.service';
import { Flight } from '../models/flight.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};

describe('bookingGuard', () => {
  let flow: BookingFlowService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    flow   = TestBed.inject(BookingFlowService);
    router = TestBed.inject(Router);
  });

  it('returns true when flight is selected', () => {
    flow.selectFlight(flight);
    const result = TestBed.runInInjectionContext(
      () => bookingGuard({} as any, {} as any),
    );
    expect(result).toBeTrue();
  });

  it('redirects to /flights when no flight is selected', () => {
    const result = TestBed.runInInjectionContext(
      () => bookingGuard({} as any, {} as any),
    );
    expect(result).toEqual(router.createUrlTree(['/flights']));
  });
});
```

```ts
// src/app/shared/guards/payment.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { paymentGuard } from './payment.guard';
import { BookingFlowService } from '../services/booking-flow.service';
import { Booking } from '../models/booking.model';

const booking: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};

describe('paymentGuard', () => {
  let flow: BookingFlowService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    flow   = TestBed.inject(BookingFlowService);
    router = TestBed.inject(Router);
  });

  it('returns true when booking is set', () => {
    flow.setBooking(booking);
    const result = TestBed.runInInjectionContext(
      () => paymentGuard({} as any, {} as any),
    );
    expect(result).toBeTrue();
  });

  it('redirects to /booking when no booking is set', () => {
    const result = TestBed.runInInjectionContext(
      () => paymentGuard({} as any, {} as any),
    );
    expect(result).toEqual(router.createUrlTree(['/booking']));
  });
});
```

- [ ] **Step 6: Run guard tests to verify they fail**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/shared/guards/booking.guard.spec.ts --include=src/app/shared/guards/payment.guard.spec.ts
```

Expected: FAILED — guards not found.

- [ ] **Step 7: Implement the guards**

```ts
// src/app/shared/guards/booking.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingFlowService } from '../services/booking-flow.service';

export const bookingGuard: CanActivateFn = () => {
  const flow   = inject(BookingFlowService);
  const router = inject(Router);
  return flow.flight() !== null ? true : router.createUrlTree(['/flights']);
};
```

```ts
// src/app/shared/guards/payment.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingFlowService } from '../services/booking-flow.service';

export const paymentGuard: CanActivateFn = () => {
  const flow   = inject(BookingFlowService);
  const router = inject(Router);
  return flow.booking() !== null ? true : router.createUrlTree(['/booking']);
};
```

- [ ] **Step 8: Run guard tests to verify they pass**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/shared/guards/booking.guard.spec.ts --include=src/app/shared/guards/payment.guard.spec.ts
```

Expected: `4 specs, 0 failures`

- [ ] **Step 9: Run all tests to confirm nothing broke**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all specs pass.

- [ ] **Step 10: Commit**

```bash
git add src/app/shared/
git commit -m "feat: add BookingFlowService, route guards, and API interceptor"
```

---

## Task 3: Flights feature

**Files:**
- Modify: `src/app/flights/flights.routes.ts` (replace stub)
- Create: `src/app/flights/flight-search.component.ts`
- Create: `src/app/flights/flight-search.component.html`
- Create: `src/app/flights/flight-search.component.spec.ts`
- Create: `src/app/flights/flight-results.component.ts`
- Create: `src/app/flights/flight-results.component.html`

**Interfaces:**
- Consumes: `Flight`, `Seat` models; `BookingFlowService.selectFlight()`
- Produces: `/flights` route renders search form + results; selecting a flight populates service and navigates to `/booking`

- [ ] **Step 1: Write the failing `FlightSearchComponent` tests**

```ts
// src/app/flights/flight-search.component.spec.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/flights/flight-search.component.spec.ts
```

Expected: FAILED — `FlightSearchComponent` not found.

- [ ] **Step 3: Implement `FlightResultsComponent`**

(Implement child first so the parent can import it.)

```ts
// src/app/flights/flight-results.component.ts
import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Flight } from '../shared/models/flight.model';
import { BookingFlowService } from '../shared/services/booking-flow.service';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './flight-results.component.html',
})
export class FlightResultsComponent {
  results = input<Flight[]>([]);

  private flow   = inject(BookingFlowService);
  private router = inject(Router);

  select(flight: Flight): void {
    this.flow.selectFlight(flight);
    this.router.navigate(['/booking']);
  }
}
```

```html
<!-- src/app/flights/flight-results.component.html -->
@if (results().length === 0) {
  <p>No flights found.</p>
} @else {
  @for (flight of results(); track flight.id) {
    <div class="flight-card">
      <strong>{{ flight.flightNumber }}</strong>
      {{ flight.origin }} → {{ flight.destination }}
      <span>{{ flight.departureTime | date:'short' }} – {{ flight.arrivalTime | date:'short' }}</span>
      <span>{{ flight.price.amount | currency:flight.price.currency }}</span>
      <button type="button" (click)="select(flight)">Select</button>
    </div>
  }
}
```

- [ ] **Step 4: Implement `FlightSearchComponent`**

```ts
// src/app/flights/flight-search.component.ts
import { Component, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { Flight } from '../shared/models/flight.model';
import { FlightResultsComponent } from './flight-results.component';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [ReactiveFormsModule, FlightResultsComponent],
  templateUrl: './flight-search.component.html',
})
export class FlightSearchComponent {
  private http = inject(HttpClient);

  readonly airportCodes = ['JFK', 'LAX', 'ORD', 'SFO', 'LHR', 'NRT'];

  form = new FormGroup({
    origin:      new FormControl('', Validators.required),
    destination: new FormControl('', Validators.required),
    date:        new FormControl('', Validators.required),
  });

  results = signal<Flight[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  search(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { origin, destination, date } = this.form.value;
    const params = new HttpParams()
      .set('origin', origin!)
      .set('destination', destination!)
      .set('date', date!);

    this.http.get<Flight[]>('/api/flights', { params }).subscribe({
      next: flights => { this.results.set(flights); this.loading.set(false); },
      error: ()     => { this.error.set('Search failed. Please try again.'); this.loading.set(false); },
    });
  }
}
```

```html
<!-- src/app/flights/flight-search.component.html -->
<h2>Search Flights</h2>
<form [formGroup]="form" (ngSubmit)="search()">
  <label>
    Origin
    <select formControlName="origin">
      <option value="">-- select --</option>
      @for (code of airportCodes; track code) {
        <option [value]="code">{{ code }}</option>
      }
    </select>
  </label>

  <label>
    Destination
    <select formControlName="destination">
      <option value="">-- select --</option>
      @for (code of airportCodes; track code) {
        <option [value]="code">{{ code }}</option>
      }
    </select>
  </label>

  <label>
    Date
    <input type="date" formControlName="date" />
  </label>

  <button type="submit" [disabled]="form.invalid || loading()">
    @if (loading()) { Searching… } @else { Search }
  </button>
</form>

@if (error()) {
  <p class="error">{{ error() }}</p>
}

<app-flight-results [results]="results()" />
```

- [ ] **Step 5: Update `flights.routes.ts`**

```ts
// src/app/flights/flights.routes.ts
import { Routes } from '@angular/router';
import { FlightSearchComponent } from './flight-search.component';

export const FLIGHTS_ROUTES: Routes = [
  { path: '', component: FlightSearchComponent },
];
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/flights/flight-search.component.spec.ts
```

Expected: `5 specs, 0 failures`

- [ ] **Step 7: Run all tests**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all specs pass.

- [ ] **Step 8: Commit**

```bash
git add src/app/flights/
git commit -m "feat: add flights feature — search form and results"
```

---

## Task 4: Booking feature

**Files:**
- Modify: `src/app/booking/booking.routes.ts` (replace stub)
- Create: `src/app/booking/seat-selection.component.ts`
- Create: `src/app/booking/seat-selection.component.html`
- Create: `src/app/booking/passenger-form.component.ts`
- Create: `src/app/booking/passenger-form.component.html`
- Create: `src/app/booking/passenger-form.component.spec.ts`
- Create: `src/app/booking/booking-confirmation.component.ts`
- Create: `src/app/booking/booking-confirmation.component.html`

**Interfaces:**
- Consumes:
  - `BookingFlowService.flight()`, `.seat()`, `.selectSeat(s)`, `.setBooking(b)`
  - `GET /api/flights/{id}/seats` → `Seat[]`
  - `GET /api/bookings/generate-code` → `{ bookingCode: string }`
  - `POST /api/bookings` with header `X-Idempotency-Key: {bookingCode}` → `Booking`
- Produces: `/booking`, `/booking/passenger`, `/booking/confirmation` routes fully working; `BookingFlowService.booking()` set on success

- [ ] **Step 1: Write the failing `PassengerFormComponent` tests**

```ts
// src/app/booking/passenger-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PassengerFormComponent } from './passenger-form.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight, Seat } from '../shared/models/flight.model';
import { Booking } from '../shared/models/booking.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const seat: Seat = { id: 's1', seatNumber: '12A', class: 'ECONOMY', available: true };
const bookingResponse: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};

describe('PassengerFormComponent', () => {
  let fixture: ComponentFixture<PassengerFormComponent>;
  let component: PassengerFormComponent;
  let httpMock: HttpTestingController;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        BookingFlowService,
      ],
    }).compileComponents();

    flow     = TestBed.inject(BookingFlowService);
    flow.selectFlight(flight);
    flow.selectSeat(seat);

    fixture   = TestBed.createComponent(PassengerFormComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('form is invalid when email is malformed', () => {
    component.form.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'not-an-email', phone: '',
    });
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when firstName is missing', () => {
    component.form.patchValue({
      firstName: '', lastName: 'Doe', email: 'john@example.com', phone: '',
    });
    expect(component.form.invalid).toBeTrue();
  });

  it('on valid submit calls generate-code then POST /api/bookings with X-Idempotency-Key', () => {
    component.form.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '',
    });

    component.submit();

    const codeReq = httpMock.expectOne('/api/bookings/generate-code');
    expect(codeReq.request.method).toBe('GET');
    codeReq.flush({ bookingCode: 'AX3KF7AB' });

    const bookingReq = httpMock.expectOne('/api/bookings');
    expect(bookingReq.request.method).toBe('POST');
    expect(bookingReq.request.headers.get('X-Idempotency-Key')).toBe('AX3KF7AB');
    expect(bookingReq.request.body).toEqual({
      flightId: 'f1',
      seatNumber: '12A',
      totalAmount: 299.99,
      currency: 'USD',
      passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: null },
    });
    bookingReq.flush(bookingResponse);
  });

  it('calls service.setBooking on 201 response', () => {
    component.form.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '',
    });
    component.submit();

    httpMock.expectOne('/api/bookings/generate-code').flush({ bookingCode: 'AX3KF7AB' });
    httpMock.expectOne('/api/bookings').flush(bookingResponse, { status: 201, statusText: 'Created' });

    expect(flow.booking()).toEqual(bookingResponse);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/booking/passenger-form.component.spec.ts
```

Expected: FAILED — `PassengerFormComponent` not found.

- [ ] **Step 3: Implement `SeatSelectionComponent`**

```ts
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
}
```

```html
<!-- src/app/booking/seat-selection.component.html -->
<h2>Select a Seat</h2>

@if (loading()) {
  <p>Loading seats…</p>
} @else if (error()) {
  <p class="error">{{ error() }}</p>
} @else {
  <div class="seat-grid">
    @for (seat of seats(); track seat.id) {
      <button
        type="button"
        [disabled]="!seat.available"
        (click)="select(seat)">
        {{ seat.seatNumber }} ({{ seat.class }})
        @if (!seat.available) { — taken }
      </button>
    }
  </div>
}
```

- [ ] **Step 4: Implement `PassengerFormComponent`**

```ts
// src/app/booking/passenger-form.component.ts
import { Component, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Booking } from '../shared/models/booking.model';

@Component({
  selector: 'app-passenger-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './passenger-form.component.html',
})
export class PassengerFormComponent {
  private http   = inject(HttpClient);
  private flow   = inject(BookingFlowService);
  private router = inject(Router);

  submitting = signal(false);
  error      = signal<string | null>(null);

  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName:  new FormControl('', Validators.required),
    email:     new FormControl('', [Validators.required, Validators.email]),
    phone:     new FormControl(''),
  });

  submit(): void {
    if (this.form.invalid) return;
    const flight = this.flow.flight()!;
    const seat   = this.flow.seat()!;
    const { firstName, lastName, email, phone } = this.form.value;

    this.submitting.set(true);
    this.error.set(null);

    this.http.get<{ bookingCode: string }>('/api/bookings/generate-code').pipe(
      switchMap(({ bookingCode }) => {
        const headers = new HttpHeaders({ 'X-Idempotency-Key': bookingCode });
        const body = {
          flightId:    flight.id,
          seatNumber:  seat.seatNumber,
          totalAmount: flight.price.amount,
          currency:    flight.price.currency,
          passenger: {
            firstName: firstName!,
            lastName:  lastName!,
            email:     email!,
            phone:     phone || null,
          },
        };
        return this.http.post<Booking>('/api/bookings', body, { headers });
      }),
    ).subscribe({
      next: booking => {
        this.flow.setBooking(booking);
        this.router.navigate(['/booking/confirmation']);
      },
      error: () => {
        this.error.set('Booking failed. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
```

```html
<!-- src/app/booking/passenger-form.component.html -->
<h2>Passenger Details</h2>
<form [formGroup]="form" (ngSubmit)="submit()">
  <label>
    First Name
    <input type="text" formControlName="firstName" />
  </label>
  <label>
    Last Name
    <input type="text" formControlName="lastName" />
  </label>
  <label>
    Email
    <input type="email" formControlName="email" />
    @if (form.controls.email.invalid && form.controls.email.touched) {
      <span class="error">Valid email required.</span>
    }
  </label>
  <label>
    Phone (optional)
    <input type="tel" formControlName="phone" />
  </label>
  <button type="submit" [disabled]="form.invalid || submitting()">
    @if (submitting()) { Creating booking… } @else { Continue to Payment }
  </button>
</form>

@if (error()) {
  <p class="error">{{ error() }}</p>
}
```

- [ ] **Step 5: Implement `BookingConfirmationComponent`**

```ts
// src/app/booking/booking-confirmation.component.ts
import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { BookingFlowService } from '../shared/services/booking-flow.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './booking-confirmation.component.html',
})
export class BookingConfirmationComponent {
  private router = inject(Router);
  flow = inject(BookingFlowService);

  ngOnInit(): void {
    if (!this.flow.booking()) this.router.navigate(['/booking']);
  }
}
```

```html
<!-- src/app/booking/booking-confirmation.component.html -->
@if (flow.booking(); as booking) {
  <h2>Booking Confirmed</h2>
  <p>Booking Code: <strong>{{ booking.bookingCode }}</strong></p>
  <p>Flight: {{ booking.flightId }}</p>
  <p>Seat: {{ booking.seatNumber }}</p>
  <p>Passenger: {{ booking.passenger.firstName }} {{ booking.passenger.lastName }}</p>
  <p>Total: {{ booking.totalAmount | currency:booking.currency }}</p>
  <p>Status: {{ booking.status }}</p>
  <a routerLink="/payment">
    <button type="button">Proceed to Payment</button>
  </a>
}
```

- [ ] **Step 6: Update `booking.routes.ts`**

```ts
// src/app/booking/booking.routes.ts
import { Routes } from '@angular/router';
import { bookingGuard } from '../shared/guards/booking.guard';
import { SeatSelectionComponent } from './seat-selection.component';
import { PassengerFormComponent } from './passenger-form.component';
import { BookingConfirmationComponent } from './booking-confirmation.component';

export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [bookingGuard],
    children: [
      { path: '',             component: SeatSelectionComponent },
      { path: 'passenger',   component: PassengerFormComponent },
      { path: 'confirmation', component: BookingConfirmationComponent },
    ],
  },
];
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/booking/passenger-form.component.spec.ts
```

Expected: `4 specs, 0 failures`

- [ ] **Step 8: Run all tests**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add src/app/booking/
git commit -m "feat: add booking feature — seat selection, passenger form, confirmation"
```

---

## Task 5: Payment feature

**Files:**
- Modify: `src/app/payment/payment.routes.ts` (replace stub)
- Create: `src/app/payment/payment-form.component.ts`
- Create: `src/app/payment/payment-form.component.html`
- Create: `src/app/payment/payment-form.component.spec.ts`
- Create: `src/app/payment/payment-receipt.component.ts`
- Create: `src/app/payment/payment-receipt.component.html`
- Create: `src/app/payment/payment-receipt.component.spec.ts`

**Interfaces:**
- Consumes:
  - `BookingFlowService.booking()`, `.setPayment(p)`
  - `POST /api/payments` → `Payment`
  - `GET /api/bookings/{bookingCode}?lastName={lastName}` → `Booking` (polling)
- Produces: `/payment` and `/payment/receipt` routes; receipt polls until `CONFIRMED`, `PAYMENT_FAILED`, or 30 s timeout

- [ ] **Step 1: Write the failing `PaymentFormComponent` tests**

```ts
// src/app/payment/payment-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PaymentFormComponent } from './payment-form.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight } from '../shared/models/flight.model';
import { Booking } from '../shared/models/booking.model';
import { Payment } from '../shared/models/payment.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const booking: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};
const paymentResponse: Payment = {
  id: 'p1', bookingCode: 'AX3KF7AB', amount: 299.99, currency: 'USD',
  status: 'SUCCESS', attempts: [], createdAt: '2024-01-15T10:01:00Z',
};

describe('PaymentFormComponent', () => {
  let fixture: ComponentFixture<PaymentFormComponent>;
  let component: PaymentFormComponent;
  let httpMock: HttpTestingController;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        BookingFlowService,
      ],
    }).compileComponents();

    flow = TestBed.inject(BookingFlowService);
    flow.selectFlight(flight);
    flow.setBooking(booking);

    fixture   = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('switching method clears previous sub-form values', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });

    component.methodControl.setValue('PAYPAL');

    expect(component.detailsForm.value).toEqual({ email: '' });
  });

  it('CREDIT_CARD submit sends correct body shape', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });

    component.submit();

    const req = httpMock.expectOne('/api/payments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      bookingCode: 'AX3KF7AB',
      method: 'CREDIT_CARD',
      details: { cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 },
    });
    req.flush(paymentResponse, { status: 201, statusText: 'Created' });
  });

  it('shows inline error and does not navigate on 402 response', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });
    component.submit();

    const req = httpMock.expectOne('/api/payments');
    req.flush({ error: 'Payment declined' }, { status: 402, statusText: 'Payment Required' });

    expect(component.error()).toBe('Payment declined — please try another method.');
    expect(component.submitting()).toBeFalse();
  });

  it('calls flow.setPayment and navigates to /payment/receipt on 201', () => {
    component.methodControl.setValue('CREDIT_CARD');
    component.detailsForm.patchValue({ cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2027 });
    component.submit();

    httpMock.expectOne('/api/payments').flush(paymentResponse, { status: 201, statusText: 'Created' });

    expect(flow.payment()).toEqual(paymentResponse);
  });
});
```

- [ ] **Step 2: Write the failing `PaymentReceiptComponent` tests**

```ts
// src/app/payment/payment-receipt.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PaymentReceiptComponent } from './payment-receipt.component';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Flight } from '../shared/models/flight.model';
import { Booking } from '../shared/models/booking.model';
import { Payment } from '../shared/models/payment.model';

const flight: Flight = {
  id: 'f1', flightNumber: 'AX001', origin: 'JFK', destination: 'LAX',
  departureTime: '2024-01-15T10:00:00Z', arrivalTime: '2024-01-15T13:00:00Z',
  price: { amount: 299.99, currency: 'USD' },
};
const booking: Booking = {
  bookingCode: 'AX3KF7AB', flightId: 'f1', seatNumber: '12A', status: 'PENDING',
  totalAmount: 299.99, currency: 'USD',
  passenger: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  createdAt: '2024-01-15T10:00:00Z',
};
const payment: Payment = {
  id: 'p1', bookingCode: 'AX3KF7AB', amount: 299.99, currency: 'USD',
  status: 'SUCCESS', attempts: [], createdAt: '2024-01-15T10:01:00Z',
};

describe('PaymentReceiptComponent', () => {
  let fixture: ComponentFixture<PaymentReceiptComponent>;
  let component: PaymentReceiptComponent;
  let httpMock: HttpTestingController;
  let flow: BookingFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentReceiptComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        BookingFlowService,
      ],
    }).compileComponents();

    flow = TestBed.inject(BookingFlowService);
    flow.selectFlight(flight);
    flow.setBooking(booking);
    flow.setPayment(payment);

    fixture   = TestBed.createComponent(PaymentReceiptComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts polling on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(2000);

    httpMock.expectOne('/api/bookings/AX3KF7AB?lastName=Doe')
      .flush({ ...booking, status: 'CONFIRMED' });

    discardPeriodicTasks();
  }));

  it('stops polling and sets resolvedBooking when status is CONFIRMED', fakeAsync(() => {
    fixture.detectChanges();
    tick(2000);

    httpMock.expectOne('/api/bookings/AX3KF7AB?lastName=Doe')
      .flush({ ...booking, status: 'CONFIRMED' });

    fixture.detectChanges();
    expect(component.resolvedBooking()).toEqual({ ...booking, status: 'CONFIRMED' });

    // No further poll should be made
    tick(2000);
    httpMock.expectNone('/api/bookings/AX3KF7AB?lastName=Doe');
  }));

  it('stops polling and sets resolvedBooking when status is PAYMENT_FAILED', fakeAsync(() => {
    fixture.detectChanges();
    tick(2000);

    httpMock.expectOne('/api/bookings/AX3KF7AB?lastName=Doe')
      .flush({ ...booking, status: 'PAYMENT_FAILED' });

    fixture.detectChanges();
    expect(component.resolvedBooking()).toEqual({ ...booking, status: 'PAYMENT_FAILED' });

    tick(2000);
    httpMock.expectNone('/api/bookings/AX3KF7AB?lastName=Doe');
  }));

  it('stops polling and sets timedOut after 30 seconds', fakeAsync(() => {
    fixture.detectChanges();

    // At 30 000 ms the interval (15th tick) and timer(30000) both fire.
    // Use match() not expectOne() because the 15th HTTP request may or may
    // not still be pending depending on RxJS internal scheduling order.
    for (let i = 0; i < 15; i++) {
      tick(2000);
      httpMock.match('/api/bookings/AX3KF7AB?lastName=Doe')
        .forEach(r => r.flush({ ...booking, status: 'PENDING' }));
    }

    fixture.detectChanges();
    expect(component.timedOut()).toBeTrue();

    tick(2000);
    httpMock.expectNone('/api/bookings/AX3KF7AB?lastName=Doe');
  }));
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/payment/payment-form.component.spec.ts --include=src/app/payment/payment-receipt.component.spec.ts
```

Expected: FAILED — components not found.

- [ ] **Step 4: Implement `PaymentFormComponent`**

```ts
// src/app/payment/payment-form.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Payment } from '../shared/models/payment.model';

type PaymentMethod = 'CREDIT_CARD' | 'PAYPAL' | 'APPLE_PAY' | 'PIX' | 'IDEAL';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './payment-form.component.html',
})
export class PaymentFormComponent implements OnInit {
  private http   = inject(HttpClient);
  private flow   = inject(BookingFlowService);
  private router = inject(Router);

  readonly methods: PaymentMethod[] = ['CREDIT_CARD', 'PAYPAL', 'APPLE_PAY', 'PIX', 'IDEAL'];
  methodControl = new FormControl<PaymentMethod>('CREDIT_CARD', { nonNullable: true });
  detailsForm: FormGroup = new FormGroup({});

  submitting = signal(false);
  error      = signal<string | null>(null);

  ngOnInit(): void {
    this.buildDetailsForm(this.methodControl.value);
    this.methodControl.valueChanges.subscribe(method => this.buildDetailsForm(method));
  }

  private buildDetailsForm(method: PaymentMethod): void {
    const controls: Record<string, AbstractControl> = {};
    switch (method) {
      case 'CREDIT_CARD':
        controls['cardNumber']  = new FormControl('', Validators.required);
        controls['expiryMonth'] = new FormControl('', Validators.required);
        controls['expiryYear']  = new FormControl('', Validators.required);
        break;
      case 'PAYPAL':
        controls['email'] = new FormControl('', [Validators.required, Validators.email]);
        break;
      case 'APPLE_PAY':
        controls['token'] = new FormControl('', Validators.required);
        break;
      case 'PIX':
        controls['pixKey'] = new FormControl('', Validators.required);
        break;
      case 'IDEAL':
        controls['bank'] = new FormControl('', Validators.required);
        break;
    }
    // Replace all controls
    Object.keys(this.detailsForm.controls).forEach(k => this.detailsForm.removeControl(k));
    Object.entries(controls).forEach(([k, c]) => this.detailsForm.addControl(k, c));
  }

  submit(): void {
    const booking = this.flow.booking()!;
    this.submitting.set(true);
    this.error.set(null);

    const body = {
      bookingCode: booking.bookingCode,
      method:      this.methodControl.value,
      details:     this.detailsForm.value,
    };

    this.http.post<Payment>('/api/payments', body).subscribe({
      next: payment => {
        this.flow.setPayment(payment);
        this.router.navigate(['/payment/receipt']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 402) {
          this.error.set('Payment declined — please try another method.');
        } else if (err.status === 409) {
          this.router.navigate(['/payment/receipt']);
        } else {
          this.error.set('Payment failed. Please try again.');
        }
        this.submitting.set(false);
      },
    });
  }
}
```

```html
<!-- src/app/payment/payment-form.component.html -->
<h2>Payment</h2>

<label>
  Payment Method
  <select [formControl]="methodControl">
    @for (method of methods; track method) {
      <option [value]="method">{{ method }}</option>
    }
  </select>
</label>

<form [formGroup]="detailsForm" (ngSubmit)="submit()">
  @switch (methodControl.value) {
    @case ('CREDIT_CARD') {
      <label>Card Number <input type="text" formControlName="cardNumber" /></label>
      <label>Expiry Month <input type="number" formControlName="expiryMonth" /></label>
      <label>Expiry Year  <input type="number" formControlName="expiryYear" /></label>
    }
    @case ('PAYPAL') {
      <label>PayPal Email <input type="email" formControlName="email" /></label>
    }
    @case ('APPLE_PAY') {
      <label>Token <input type="text" formControlName="token" /></label>
    }
    @case ('PIX') {
      <label>PIX Key <input type="text" formControlName="pixKey" /></label>
    }
    @case ('IDEAL') {
      <label>Bank <input type="text" formControlName="bank" /></label>
    }
  }

  <button type="submit" [disabled]="detailsForm.invalid || submitting()">
    @if (submitting()) { Processing… } @else { Pay Now }
  </button>
</form>

@if (error()) {
  <p class="error">{{ error() }}</p>
}
```

- [ ] **Step 5: Implement `PaymentReceiptComponent`**

```ts
// src/app/payment/payment-receipt.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { BookingFlowService } from '../shared/services/booking-flow.service';
import { Booking } from '../shared/models/booking.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-payment-receipt',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './payment-receipt.component.html',
})
export class PaymentReceiptComponent implements OnInit {
  private http       = inject(HttpClient);
  private flow       = inject(BookingFlowService);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  resolvedBooking = signal<Booking | null>(null);
  timedOut        = signal(false);

  ngOnInit(): void {
    const booking = this.flow.booking();
    if (!booking) { this.router.navigate(['/payment']); return; }

    const stop$ = new Subject<void>();

    interval(2000).pipe(
      takeUntilDestroyed(this.destroyRef),
      takeUntil(stop$),
      switchMap(() =>
        this.http.get<Booking>(
          `/api/bookings/${booking.bookingCode}?lastName=${booking.passenger.lastName}`,
        ),
      ),
    ).subscribe(b => {
      if (b.status === 'CONFIRMED' || b.status === 'PAYMENT_FAILED') {
        this.resolvedBooking.set(b);
        stop$.next();
      }
    });

    timer(30000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.resolvedBooking()) {
        this.timedOut.set(true);
        stop$.next();
      }
    });
  }

  restart(): void {
    this.flow.reset();
    this.router.navigate(['/flights']);
  }
}
```

```html
<!-- src/app/payment/payment-receipt.component.html -->
<h2>Booking Receipt</h2>

@if (resolvedBooking(); as b) {
  @if (b.status === 'CONFIRMED') {
    <p>Your booking is confirmed!</p>
  } @else {
    <p>Payment failed. Please contact support.</p>
  }
  <p>Booking Code: <strong>{{ b.bookingCode }}</strong></p>
  <p>Passenger: {{ b.passenger.firstName }} {{ b.passenger.lastName }}</p>
  <p>Total: {{ b.totalAmount | currency:b.currency }}</p>
  <p>Status: {{ b.status }}</p>
  <button type="button" (click)="restart()">Book Another Flight</button>
} @else if (timedOut()) {
  <p>Could not confirm booking status. Please check your email or contact support.</p>
  <button type="button" (click)="restart()">Start Over</button>
} @else {
  <p>Confirming your booking…</p>
}
```

- [ ] **Step 6: Update `payment.routes.ts`**

```ts
// src/app/payment/payment.routes.ts
import { Routes } from '@angular/router';
import { paymentGuard } from '../shared/guards/payment.guard';
import { PaymentFormComponent } from './payment-form.component';
import { PaymentReceiptComponent } from './payment-receipt.component';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [paymentGuard],
    children: [
      { path: '',        component: PaymentFormComponent },
      { path: 'receipt', component: PaymentReceiptComponent },
    ],
  },
];
```

- [ ] **Step 7: Run payment tests**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/payment/payment-form.component.spec.ts --include=src/app/payment/payment-receipt.component.spec.ts
```

Expected: `8 specs, 0 failures`

- [ ] **Step 8: Run all tests**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all specs pass (17+ specs total).

- [ ] **Step 9: Commit**

```bash
git add src/app/payment/
git commit -m "feat: add payment feature — form with method switching and receipt with polling"
```

---

## Task 6: Docker + README

**Files:**
- Modify: `Dockerfile` (replace stub with multi-stage build)
- Create: `nginx.conf`
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Create: `README.md`

**Interfaces:**
- Consumes: built Angular app at `dist/aeronuk-client/browser/`
- Produces: Docker image that serves the SPA on port 4200

- [ ] **Step 1: Confirm build output path**

```bash
npm run build
ls dist/aeronuk-client/
```

Expected output is either `browser/` subfolder (Angular 17+ `application` builder) or directly `index.html`.
Use the actual path in the Dockerfile COPY step below. The path below assumes `dist/aeronuk-client/browser/`.

- [ ] **Step 2: Replace `Dockerfile`**

```dockerfile
# Dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/dist/aeronuk-client/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200
```

If Step 1 showed the output is at `dist/aeronuk-client/` (no `browser/` subfolder), change the COPY path to `/app/dist/aeronuk-client`.

- [ ] **Step 3: Create `nginx.conf`**

```nginx
server {
  listen 4200;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 4: Replace `docker-compose.yml`**

```yaml
services:
  aeronuk-client:
    build: .
    container_name: aeronuk-client
    ports:
      - "4200:4200"
    networks:
      - aeronuk-network

networks:
  aeronuk-network:
    name: aeronuk-network
    driver: bridge
```

- [ ] **Step 5: Update `.env.example`**

```
# Copy this to .env and adjust as needed
# This file is safe to commit — .env is gitignored
```

(No environment variables are needed — the Angular app uses relative /api paths.)

- [ ] **Step 6: Create `README.md`**

```markdown
# aeronuk-client

Angular 20 frontend for the AeroNuk distributed airline booking platform.

## Development

```bash
npm install
npm start          # ng serve with proxy to localhost:80
```

Open http://localhost:4200.

The dev proxy (`proxy.conf.json`) forwards `/api/*` to the aeronuk-ops nginx at `http://localhost:80`, which routes to each backend service. Run `docker compose up` in `aeronuk-ops` first.

## Tests

```bash
npm test                                          # watch mode
npx ng test --watch=false --browsers=ChromeHeadless  # CI mode
```

## Docker

```bash
docker compose up --build
```

The container serves the built Angular app on port 4200. In the full stack (`aeronuk-ops`), nginx proxies the Angular app and routes `/api/*` to the correct services.

## Future Work

- **E2E testing with Playwright**: add a `e2e/` directory with Playwright tests covering the full wizard flow (search → book → pay) against the Docker stack. See [Playwright docs](https://playwright.dev).
```

- [ ] **Step 7: Verify Docker build succeeds**

```bash
docker build -t aeronuk-client:test .
```

Expected: `Successfully built …` with no errors.

- [ ] **Step 8: Run all tests one final time**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add Dockerfile nginx.conf docker-compose.yml .env.example README.md
git commit -m "feat: add multi-stage Dockerfile, nginx SPA config, and README"
```
