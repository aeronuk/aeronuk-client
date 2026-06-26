# aeronuk-client Design Spec

## Goal

Angular 20 single-page application that drives the full booking wizard: search flights → select seat → create booking → process payment → show final booking status.

## Architecture

Standalone Angular 20 components organized into four feature domains (flights, booking, payment, shared) with lazy-loaded route arrays. A singleton `BookingFlowService` using Angular signals carries wizard state between routes. The app always talks to relative `/api/*` paths; nginx in aeronuk-ops routes each prefix to the correct backend service.

Note: ADR-006 refers to "feature modules per domain" — in Angular 20 this maps to standalone feature route arrays (`FLIGHTS_ROUTES`, `BOOKING_ROUTES`, `PAYMENT_ROUTES`) rather than NgModule classes. The domain boundaries and lazy-loading behaviour are identical; only the NgModule boilerplate is removed. Module Federation remains viable with standalone components.

## Tech Stack

- Angular 20, standalone components, Angular signals
- Angular Reactive Forms
- Angular `HttpClient` with functional interceptors (`HttpInterceptorFn`)
- Jasmine + Karma (unit tests)
- nginx:alpine (production container, SPA routing)
- Node 22 Alpine (build stage)

## Global Constraints

- Angular 20 patterns throughout: standalone components, `bootstrapApplication`, `inject()`, signals, functional guards, `provideHttpClient(withInterceptors([...]))`, `provideRouter(routes)`
- No NgModule classes anywhere
- `BookingFlowService` provided in root — single instance for the lifetime of the app
- All HTTP calls use relative paths (`/api/...`) — no hardcoded host
- Polling interval: 2 seconds; timeout: 30 seconds
- Payment methods supported: `CREDIT_CARD`, `PAYPAL`, `APPLE_PAY`, `PIX`, `IDEAL`
- Airport codes (dropdowns): `JFK`, `LAX`, `ORD`, `SFO`, `LHR`, `NRT`
- No real authentication — auth guards are structural no-ops (`() => true`)
- No E2E tests in this implementation (see Future Work)

---

## Section 1: Project structure

```
src/
├── main.ts                        # bootstrapApplication(AppComponent, appConfig)
├── app.config.ts                  # provideRouter(routes), provideHttpClient(withInterceptors([...]))
├── app.routes.ts                  # top-level lazy routes
├── app.component.{ts,html}        # standalone shell: <nav> + <router-outlet>
│
├── shared/
│   ├── models/
│   │   ├── flight.model.ts
│   │   ├── booking.model.ts
│   │   └── payment.model.ts
│   ├── services/
│   │   └── booking-flow.service.ts
│   ├── guards/
│   │   ├── booking.guard.ts
│   │   └── payment.guard.ts
│   └── interceptors/
│       └── api.interceptor.ts
│
├── flights/
│   ├── flights.routes.ts
│   ├── flight-search.component.{ts,html}
│   └── flight-results.component.{ts,html}
│
├── booking/
│   ├── booking.routes.ts
│   ├── seat-selection.component.{ts,html}
│   ├── passenger-form.component.{ts,html}
│   └── booking-confirmation.component.{ts,html}
│
└── payment/
    ├── payment.routes.ts
    ├── payment-form.component.{ts,html}
    └── payment-receipt.component.{ts,html}
```

### Top-level routes (`app.routes.ts`)

```ts
{ path: 'flights',  loadChildren: () => import('./flights/flights.routes').then(m => m.FLIGHTS_ROUTES) },
{ path: 'booking',  loadChildren: () => import('./booking/booking.routes').then(m => m.BOOKING_ROUTES) },
{ path: 'payment',  loadChildren: () => import('./payment/payment.routes').then(m => m.PAYMENT_ROUTES) },
{ path: '',         redirectTo: 'flights', pathMatch: 'full' }
```

---

## Section 2: Wizard state & data models

### Models

```ts
// shared/models/flight.model.ts
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

// shared/models/booking.model.ts
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

// shared/models/payment.model.ts
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

### `BookingFlowService`

```ts
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

  selectFlight(flight: Flight) {
    this._flight.set(flight);
    this._seat.set(null);
    this._booking.set(null);
    this._payment.set(null);
  }
  selectSeat(seat: Seat)       { this._seat.set(seat); }
  setBooking(booking: Booking) { this._booking.set(booking); }
  setPayment(payment: Payment) { this._payment.set(payment); }
  reset() {
    this._flight.set(null); this._seat.set(null);
    this._booking.set(null); this._payment.set(null);
  }
}
```

`selectFlight` clears downstream state so re-selecting a flight never carries stale seat/booking/payment data forward.

### Route guards

```ts
// booking.guard.ts
export const bookingGuard: CanActivateFn = () => {
  const flow = inject(BookingFlowService);
  return flow.flight() !== null ? true : inject(Router).createUrlTree(['/flights']);
};

// payment.guard.ts
export const paymentGuard: CanActivateFn = () => {
  const flow = inject(BookingFlowService);
  return flow.booking() !== null ? true : inject(Router).createUrlTree(['/booking']);
};
```

Auth guards are structural no-ops — `() => true` — present in the route config to mark where real auth would live.

---

## Section 3: Screens & user flows

### `/flights` — FlightsModule

**`FlightSearchComponent`**
Reactive form with three required fields:
- `origin` — dropdown: JFK / LAX / ORD / SFO / LHR / NRT
- `destination` — same dropdown
- `date` — date input (YYYY-MM-DD)

On submit calls `GET /api/flights?origin=&destination=&date=`. Results stored in a component-level `results = signal<Flight[]>([])` and displayed below the form by `FlightResultsComponent` (rendered in the same view, not a separate route).

**`FlightResultsComponent`**
A child component rendered inside `FlightSearchComponent`'s template (`<app-flight-results [results]="results()" />`). Receives the results array via `@Input()`. Renders flight cards: flight number, origin→destination, departure/arrival times, price. "Select" button calls `service.selectFlight(flight)` then `router.navigate(['/booking'])`.

### `/booking` — BookingModule (guarded by `bookingGuard`)

Routes:
```
/booking           → SeatSelectionComponent
/booking/passenger → PassengerFormComponent
/booking/confirmation → BookingConfirmationComponent
```

**`SeatSelectionComponent`**
On init: `GET /api/flights/{flight.id}/seats`. Renders seats grouped or as a simple grid. Available seats are selectable; unavailable seats are greyed out and not clickable. "Confirm Seat" calls `service.selectSeat(seat)`, navigates to `/booking/passenger`.

**`PassengerFormComponent`**
Reactive form: `firstName` (required), `lastName` (required), `email` (required, `Validators.email`), `phone` (optional).

On submit:
1. `GET /api/bookings/generate-code` → `{ bookingCode: string }`
2. `POST /api/bookings` with header `X-Idempotency-Key: {bookingCode}` and body:
   ```json
   {
     "flightId": "<selected flight id>",
     "seatNumber": "<selected seat number>",
     "totalAmount": "<flight price amount>",
     "currency": "<flight price currency>",
     "passenger": { "firstName", "lastName", "email", "phone" }
   }
   ```
3. On 201 or 200 (idempotent): `service.setBooking(response)`, navigate to `/booking/confirmation`.

**`BookingConfirmationComponent`**
Read-only summary: booking code, flight number, origin→destination, seat, passenger name, total amount + currency. "Proceed to Payment" button → `/payment`.

### `/payment` — PaymentModule (guarded by `paymentGuard`)

Routes:
```
/payment         → PaymentFormComponent
/payment/receipt → PaymentReceiptComponent
```

**`PaymentFormComponent`**
Method selector: `CREDIT_CARD` | `PAYPAL` | `APPLE_PAY` | `PIX` | `IDEAL`. Dynamic sub-form per method:
- `CREDIT_CARD`: cardNumber, expiryMonth, expiryYear
- `PAYPAL`: email
- `APPLE_PAY`: token
- `PIX`: pixKey
- `IDEAL`: bank

Switching method resets the sub-form.

On submit: `POST /api/payments` with `{ bookingCode, method, details }`.
- 201 → `service.setPayment(response)`, navigate to `/payment/receipt`
- 402 → inline error: "Payment declined — please try another method."
- 409 → navigate to `/payment/receipt` (already processed)
- 404 → inline error: "No pending booking found."

**`PaymentReceiptComponent`**
On init: polls `GET /api/bookings/{bookingCode}?lastName={passenger.lastName}` every 2 seconds.

Stops polling when:
- `status === 'CONFIRMED'` → show success card
- `status === 'PAYMENT_FAILED'` → show failure card
- 30 seconds elapsed without resolution → show timeout message

Shows a spinner while polling. "Book another flight" button (visible after resolution or timeout) calls `service.reset()` and navigates to `/flights`.

---

## Section 4: Testing strategy

Framework: Jasmine + Karma (Angular 20 default).

### `BookingFlowService` (pure unit, no TestBed)
- Initial state: all signals return null
- `selectFlight` sets flight and clears seat, booking, payment
- `selectSeat` sets seat, does not clear flight
- `setBooking` sets booking, does not clear flight or seat
- `reset` clears all four signals

### Route guards (`TestBed.runInInjectionContext`)
- `bookingGuard`: returns `true` when `service.flight()` is set; returns `UrlTree('/flights')` when null
- `paymentGuard`: returns `true` when `service.booking()` is set; returns `UrlTree('/booking')` when null

### `FlightSearchComponent` (TestBed + `ReactiveFormsModule`)
- Form invalid when any of origin, destination, date is missing
- Valid submit calls `HttpClient.get` with correct query string
- `results` signal is populated on successful response

### `PassengerFormComponent` (TestBed + `HttpClientTestingModule`)
- Email validator rejects malformed input
- Valid submit calls generate-code endpoint then POST /api/bookings
- `X-Idempotency-Key` header is set from generated code
- `service.setBooking` called and navigation to `/booking/confirmation` on 201

### `PaymentFormComponent` (TestBed + `HttpClientTestingModule`)
- Switching payment method clears previous sub-form values
- CREDIT_CARD submit sends correct body shape
- 402 response shows inline error, does not navigate
- 201 response calls `service.setPayment` and navigates to `/payment/receipt`

### `PaymentReceiptComponent` (TestBed + `HttpClientTestingModule`, fake timers)
- Polls on component init
- Stops polling when status is `CONFIRMED`
- Stops polling when status is `PAYMENT_FAILED`
- Stops polling after 30 seconds and shows timeout message

---

## Section 5: Docker & dev setup

### `Dockerfile` (replaces existing Node.js stub)

```dockerfile
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

### `nginx.conf` (SPA routing — all paths serve `index.html`)

```nginx
server {
  listen 4200;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
```

### `proxy.conf.json` (local `ng serve` only)

```json
{
  "/api": { "target": "http://localhost:80", "secure": false }
}
```

`angular.json` `serve` target references `"proxyConfig": "proxy.conf.json"`. In Docker the proxy is not needed — the aeronuk-ops nginx handles all `/api` routing.

---

## Future Work

- **E2E testing with Playwright**: add a `e2e/` directory with Playwright tests covering the full wizard flow against the Docker stack. Deferred to a follow-on PR.
