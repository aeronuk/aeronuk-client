# aeronuk-client — Claude Code guide

Angular 21 SPA for the AeroNuk platform. For system-wide architecture, ADRs,
RabbitMQ topology, and event contracts see `aeronuk-ops/README.md`.

## Commit policy

**Never add `Co-Authored-By` trailers** to any commit in this project.

## Status

**Fully implemented.** The complete booking flow is done (all 10+ screens).
The last commit (`ae9fb9f`) applied the full design handoff redesign.
`ng build` is clean — 0 errors, 0 warnings.

## Stack

- Angular 21, standalone components throughout (no NgModules)
- Tailwind CSS v4 with `@theme` tokens in `src/styles.css`; every component
  has a colocated `styleUrl` stylesheet for its own one-off values, and
  styling patterns that repeat across components live as shared classes in
  `src/styles.css` instead of being duplicated per component. Static
  `style=""` attributes are not used; a dynamic `[style.x]` binding is only
  acceptable for values that are genuinely continuous (e.g. an
  animation's rotation angle) rather than a small discrete set of states,
  which should be `[class.x]` bindings backed by real CSS instead
- Hanken Grotesk from Google Fonts (loaded in `index.html`)
- Signal-based state (no NgRx, no BehaviorSubject)
- `toSignal()` for converting RxJS observables to signals
- Lazy-loaded route chunks per feature

## Dev commands

```bash
npx ng serve          # dev server at http://localhost:4200
npx ng build          # production build → dist/aeronuk-client
npx ng test           # Karma unit tests (not yet written)
```

## Design system tokens (src/styles.css `@theme`)

| Token | Value | Use |
|-------|-------|-----|
| Navy | `#0B1E3D` | Primary text, header background |
| Blue | `#2180E0` | CTAs, links, active states, focus rings |
| Blue light | `#3B9EFF` | Gradient end on primary buttons |
| Error | `#B3261E` | Error text |
| Error bg | `#FCEBEA` | Error field/banner background |
| Success | `#1F9D6B` | Success/confirmed states, checkmarks |
| Muted text | `#5C6B84` | Labels, secondary text |
| Very muted | `#8A99B3` | Placeholder-level hints |
| Border | `#E4E9F2` | Card borders, dividers |
| Page bg | `#F4F6FB` | App background |

## Global utility CSS classes (src/styles.css)

```
.btn-primary     hover: translateY(-2px), brightness(0.88) saturate(1.25), blue glow shadow
.btn-navy        hover: background #16305c, translateY(-1px)
.btn-outline     hover: background #F4F6FB, translateY(-1px)
.field-input     width:100%, border-radius:11px, focus ring blue, .error variant red
.field-select    appearance:none (overlaid native select trick)
.error-text      error-colored text
.error-banner    error bg + text, padding, rounded — inline form/page error messages
.page-container  1180px content column, 26/24/72 padding — shared top-level screen wrapper
.back-link       "← Back to X" link style used across the booking flow screens
.card            white bg, 18px radius, standard elevated box-shadow
.card-pad-28     .card + 28px padding (form cards)
.card-sidebar    .card + 24px padding, sticky at top:88px (trip/order summary sidebars)
.destination-card-*  destination card grid/image/body classes shared between the
                      "Popular right now" and "All destinations" screens
```

## Routing structure

```
/                        → redirect to /flights
/flights                 → FlightSearchComponent   (home / search)
/flights/results         → FlightResultsComponent  (search results)
/destinations            → AllDestinationsComponent
/booking                 → FlightDetailsComponent  (fare selection) [bookingGuard]
/booking/passenger       → PassengerFormComponent
/booking/seats           → SeatSelectionComponent
/booking/confirmation    → BookingConfirmationComponent
/payment                 → PaymentFormComponent    [paymentGuard]
/my-trips                → MyTripsComponent
/my-trips/result         → MyTripsResultComponent
```

## Guards

- `bookingGuard` — requires `flow.flight() !== null`; redirects to `/flights`
- `paymentGuard` — requires `flow.seat() !== null`; redirects to `/booking/seats`

## Key services

### BookingFlowService (`src/app/shared/services/booking-flow.service.ts`)

Signal-based in-memory state for the active booking flow.

```ts
// Signals (all readonly externally):
flight: Signal<Flight | null>
seat: Signal<Seat | null>
booking: Signal<Booking | null>
payment: Signal<Payment | null>
fare: Signal<string>           // 'Economy Saver' | 'Economy Flex' | 'Business'
passengerDraft: Signal<PassengerDraft | null>

// Mutators:
selectFlight(flight)     // also clears seat/booking/payment/draft/fare
selectSeat(seat)
setFare(fare)
setPassengerDraft(draft)
setBooking(booking)
setPayment(payment)
reset()                  // clears everything
```

### SearchStateService (`src/app/shared/services/search-state.service.ts`)

Carries origin/destination/date between the search form and results page.

```ts
origin = signal('LHR'); originCity = signal('London'); originAirport = signal('Heathrow')
destination = signal(''); destinationCity = signal(''); destinationAirport = signal('')
date = signal('')
setSearch(origin, originCity, originAirport, destination, destinationCity, destinationAirport, date)
```

### MyTripsStateService (in `src/app/my-trips/my-trips.component.ts`)

```ts
foundBooking = signal<Booking | null>(null)
```

## Models

### PassengerDraft (`src/app/shared/models/booking.model.ts`)
```ts
{ title, firstName, lastName, dob, nationality, email, mobile }
```

### Flight (`src/app/shared/models/flight.model.ts`)
```ts
{ id, origin, destination, airline, flightNumber, departureTime, arrivalTime,
  duration, price: { amount, currency }, availableSeats }
```

### Seat (`src/app/shared/models/flight.model.ts`)
```ts
{ id, seatNumber, class: string, available: boolean }
```

### Booking (`src/app/shared/models/booking.model.ts`)
```ts
{ bookingCode, flightId, seatNumber, status, totalAmount, currency,
  passenger: { firstName, lastName, email, phone? }, createdAt }
```

## Booking stepper (5 steps)

`BookingStepperComponent` — shown whenever URL starts with
`/flights/results`, `/booking`, or `/payment`.

| Step | Label | Route | activeIdx |
|------|-------|-------|-----------|
| 1 | Search | /flights | — |
| 2 | Select | /flights/results or /booking | 2 |
| 3 | Passengers | /booking/passenger | 3 |
| 4 | Seats | /booking/seats | 4 |
| 5 | Payment | /payment | 5 |

`/booking/confirmation` → activeIdx 6 (all steps green). Done steps are
clickable (navigate back). Active = blue. Upcoming = grey.

## Booking flow — screen by screen

### 1. FlightSearchComponent (`/flights`)
- 6 airports in dropdown: LHR, JFK, LAX, ORD, SFO, NRT
- Overlaid native `<select>` (opacity:0) over styled display box trick
- Swap button: 180° CSS spin per press (`swapRotation += 180`)
- `search()`: validates fields → calls `searchState.setSearch(...)` → navigates `/flights/results`
- 4 popular destination cards navigate directly to results with preset search
- Preview links: `/flights/results?preview=no-results` and `?preview=error`

### 2. FlightResultsComponent (`/flights/results`)
- Reads `SearchStateService` signals; calls `GET /api/flights?origin=X&destination=Y&date=Z`
- `screen = signal<'loading'|'results'|'no-results'|'error'>('loading')`
- `?preview=no-results` or `?preview=error` skips the API call for UI preview
- 260px sidebar: cosmetic price slider + 4 departure time toggles (Morning/Afternoon/Evening/Night)
- Flight cards show tag ('Best'/'Cheapest'), price, times, duration
- `selectFlight(flight)` → `flow.selectFlight(flight)` → navigate `/booking`

### 3. FlightDetailsComponent (`/booking`)
- 3 fare cards: Economy Saver £389 / Economy Flex £469 (Most popular) / Business £1,240
- `selectedFare` signal; selected card gets blue border + `#F5FAFF` background
- Right sidebar: itinerary timeline + Continue button
- `continue()` → `flow.setFare(selectedFare())` → navigate `/booking/passenger`

### 4. PassengerFormComponent (`/booking/passenger`)
- 7-field reactive form: title (select), firstName, lastName, dob (date), nationality (select), email, mobile
- No API call — stores data locally in `flow.setPassengerDraft()`
- `submitted` signal; error banner + red field borders on submit-invalid
- 3-col grid: Title (120px) / First & middle / Last; 2-col: DOB / Nationality
- Contact section: Email / Mobile in 2-col grid

### 5. SeatSelectionComponent (`/booking/seats`)
- Hardcoded Boeing 787-9 map: rows 8–22, cols A–F
- Rows 8–9 = extra legroom (+£18); standard seats = +£8
- 18 pre-taken seats defined in `TAKEN` Set
- `seatMeta` computed: label, desc (Window/Aisle/Middle + legroom hint), price
- `seatTotal` computed: £389 + £62 + seat cost
- `continue()` → `flow.selectSeat(seat)` → navigate `/payment`

### 6. PaymentFormComponent (`/payment`)
- Three method tabs: Card / PayPal / Apple Pay
- Card: 7-field reactive form (cardName, cardNumber, expiry, cvc, address, city, postcode)
- `submitCard()`: `GET /api/bookings/generate-code` → `POST /api/bookings` (with `X-Idempotency-Key`) → `POST /api/payments` → navigate `/booking/confirmation`
- `submitAltMethod()` (PayPal/Apple Pay): `GET /api/bookings/generate-code` → `POST /api/bookings` → navigate `/booking/confirmation` (no payment API call)
- Order summary sidebar: fare £389 + seat cost + taxes £62 = total

### 7. BookingConfirmationComponent (`/booking/confirmation`)
- Green checkmark badge (SVG)
- Displays `booking.bookingCode` in pill badge
- Flight recap: origin → destination, passenger name, seat, total paid
- Buttons: Download ticket (placeholder) + Book another flight → `flow.reset()` + navigate `/flights`

### 8. AllDestinationsComponent (`/destinations`)
- 12 destination cards in 4-col grid
- Selecting a destination → sets `SearchStateService` → navigates `/flights/results`

### 9. MyTripsComponent (`/my-trips`)
- 2-field form: bookingCode + lastName
- `GET /api/bookings/{code}?lastName=` on submit
- On success: sets `MyTripsStateService.foundBooking` → navigate `/my-trips/result`
- 404 → specific error message; other errors → generic message

### 10. MyTripsResultComponent (`/my-trips/result`)
- Reads `MyTripsStateService.foundBooking()`
- Status badge (green CONFIRMED / yellow other)
- Flight detail recap card + payment summary card
- Redirects to `/my-trips` if no booking in state

## HTTP interceptor

`ApiInterceptor` prefixes all relative URLs with the backend base URL
(empty string in dev — nginx handles routing). Set in `app.config.ts`.

## What is NOT done yet

- Unit/integration tests (`.spec.ts` files are stubs)
- Real auth/JWT (no login flow)
- Download ticket (button is a placeholder with no action)
- Multi-passenger booking (always 1 adult)
- Real seat availability from API (map is hardcoded)
- Popular destinations image assets (cards use `imageLabel` text placeholder)
