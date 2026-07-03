# Handoff: AeroNUK Flight Booking Flow

## Overview
A styled, end-to-end flight booking experience for AeroNUK, a fictional airline. Covers search, results, flight details/fare selection, passenger info, seat selection, payment, and confirmation. This is a **visual and interaction reference** for restyling/rebuilding the existing plain-HTML Angular booking app.

## About the Design Files
The bundled file (`AeroNUK Booking.dc.html`) is a **design reference built in HTML** — a clickable prototype showing intended look, layout, and behavior. It is NOT production code to copy/paste. The task is to **recreate this design inside the existing Angular application**, using Angular's own component/template/SCSS conventions (standalone components or NgModules — match whatever the existing app already uses), reusing any existing shared services/routing patterns already in the codebase.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and component styling are final and should be recreated pixel-for-pixel. Form fields in the Passenger and Payment screens are shown as styled static placeholders (not wired `<input>` elements) — implement these as real, validated Angular reactive-form inputs styled to match.

## Screens / Views

### 1. Search / Home
- **Purpose**: Entry point — user sets origin, destination, dates, passengers, and starts a search.
- **Layout**: Full-bleed navy hero (gradient `160deg #0B1E3D → #12305C → #1A3F73`, subtle radial blue glow top-right, faint oversized logo wing graphic bleeding off the right edge), height ~320px. A white search card (border-radius 22px, box-shadow `0 1px 2px rgba(11,30,61,.05), 0 24px 60px rgba(11,30,61,.16)`) overlaps the hero by -72px margin, max-width 1180px container, 26px padding. Below: a "Popular right now" section, 4-column grid of destination cards, 18px gap.
- **Components**:
  - Trip-type pill toggle (Return/One-way/Multi-city): active pill `#0B1E3D` bg / white text, inactive `#EEF2F8` bg / `#5C6B84` text, 999px radius, 9px/18px padding.
  - 3-column grid (`1.4fr 1.4fr 1fr`) of field boxes: From, To (with a circular swap button between them, 36px, white bg, positioned absolute), Depart. Each: 12px radius, 1px `#E4E9F2` border, 11px/14px padding, bold 17px primary line + 13px `#8A99B3` secondary line.
  - Primary CTA "Search flights →": gradient `150deg #2180E0→#3B9EFF`, white text, 700 weight, 16px, 12px radius, 15px/40px padding, shadow `0 8px 20px rgba(33,128,224,.32)`.
  - Destination cards: 150px striped placeholder image area (`repeating-linear-gradient(135deg,#DCE5F1 0 12px,#E7EEF7 12px 24px)`) with a monospace image-source label chip; below, city name + IATA code + "Return from £X".

### 2. Search Results
- **Purpose**: Compare and select a flight.
- **Layout**: `260px 1fr` grid — sticky filters sidebar (top:88px) + sort bar and flight list.
- **Components**:
  - Filters card: price-range slider (track `#EEF2F8`, filled `#2180E0`, 16px handle), Departure-time 2×2 button grid (selected = `#2180E0` border + `#EAF3FD` bg). Stops filter hidden (see Known Simplification).
  - Sort bar: 3-way segmented control, active segment `#0B1E3D` bg/white text with price+duration subline.
  - Flight cards: logo mark + flight number, center flight-path visual (dep time — dashed line with ✈ icon — arr time, duration + stops label colored green if direct / grey if stops), right-aligned tag chip (Best=blue, Cheapest=green, Fastest=amber) + price (26px/800) + "Select" button (`#0B1E3D` bg, white text, 10px radius).

### 3. Flight Details & Fare Selection
- **Purpose**: Review the chosen flight and pick a fare class.
- **Layout**: `1fr 360px` grid — left column stacks an itinerary timeline card and a fare-selection card; right column is a sticky trip-summary sidebar.
- **Components**:
  - Itinerary card: vertical timeline (2px line, hollow circle at dep, filled circle at arr) with dep/arr times (22px/800), airport names + terminal, flight number/aircraft/cabin subline.
  - Fare cards (3-column grid): border `1.5px solid #E4E9F2` default, `2px solid #2180E0` + `#F5FAFF` bg when selected; optional "Most popular" pill badge (`#F2A03D` bg) overlapping top edge; feature list with green ✓ checks; full-width select button (grey `#EEF2F8` default / blue `#2180E0` when selected).
  - Trip summary sidebar: route chip, fare/taxes line items, bold total (26px/800), gradient Continue button.

### 4. Passenger Details
- **Purpose**: Collect traveler name, DOB, nationality, contact info.
- **Layout**: `1fr 360px` grid, main form card + sticky trip-summary sidebar (same component as Details).
- **Components**: Passenger badge chip (numbered blue circle + "Lead passenger" label), field grid (Title/First/Last, DOB/Nationality), divider, Contact section (Email/Mobile). All fields: 11px radius, 1px `#E4E9F2` border, 13px/14px padding, label 13px/600 `#5C6B84` above.

### 5. Seat Selection
- **Purpose**: Pick a seat on an interactive cabin map.
- **Layout**: `1fr 360px` grid, cabin diagram card + sticky selection summary.
- **Components**:
  - Legend row: 4 swatches (Available = `#EAF3FD`/`#BBD8F5` border, Extra legroom = `#DDF0E8`/`#9FD8BF` border, Taken = `#E4E9F2`, Your seat = `#2180E0`).
  - Cabin: rounded-top container (`#F7F9FC` bg, 24px/24px/14px/14px radius), column letters header (A B C · D E F with aisle gap), rows of 30×30px seat buttons (7px radius) grouped 3+3 with a 14px aisle gap and row-number label.
  - Selection sidebar: large seat-code readout (32px/800) in a light `#F4F6FB` panel, price breakdown, gradient Continue button.

### 6. Payment
- **Purpose**: Enter payment + billing details and confirm purchase.
- **Layout**: `1fr 360px` grid, payment form + sticky order-summary sidebar.
- **Components**: Payment-method 3-way selector (Card/PayPal/Apple Pay, radio-style circle), card fields (Cardholder, Card number w/ mini card-brand chips, Expiry, CVC), billing address fields. Order summary: route + return chip, fare/seat/taxes line items, bold total (28px/800), gradient "Pay £X" button, fine-print terms line.

### 7. Confirmation
- **Purpose**: Confirm successful booking.
- **Layout**: Centered, max-width 720px.
- **Components**: Green gradient checkmark badge (82px circle, `150deg #22B07D→#1F9D6B`), heading + subcopy, monospace booking-reference pill (`#EAF3FD` bg / `#2180E0` text), itinerary recap card (logo + flight no./date/aircraft, seat code, dep/arr with duration+stops), two footer buttons ("Download ticket" outline, "Back to home" solid navy).

## Persistent Chrome
- **Header**: sticky, translucent white (`rgba(255,255,255,.85)`, `backdrop-filter: blur(12px)`), 1px `#E4E9F2` bottom border. Left: 38px logo mark + "Aero**NUK**" wordmark (NUK in `#2180E0`). Center nav: Book/My trips (Help and Check-in hidden — see Known Simplification). No currency selector or avatar on the right for now (see Known Simplification).
- **Booking stepper**: shown on every screen except Search. 5 steps — Search, Select, Passengers, Seats, Payment — each a 26px numbered/checkmark circle + label, connected by 34px bars. States: upcoming (`#EEF2F8` bg, `#8A99B3` text), active (`#2180E0` bg/text, bold), done (`#1F9D6B` bg, ✓ mark).
- **Footer**: wordmark, "Fictional airline · demo booking experience" note, right-aligned Privacy/Fare rules/Contact links.

## Known Simplification (temporary)
The booking API currently only supports **one-way search**. As a result, round-trip / multi-city are hidden in this build:
- Search screen: trip-type toggle only shows "One way" (Return and Multi-city pills removed).
- Search screen: the "Return date" field is removed from the search grid (now a 4-column grid: From / To / Depart / Passengers).
- Flight Details and Payment summary sidebars: the "Return" trip-type chip next to the route is removed.
- The HTML has `<!-- @handoff -->` comments marking each spot. When round-trip search ships, restore: the Return/Multi-city pills, the Return date field (back to a 5-column grid), and the "Return" chips in both summary sidebars.

There is also **no authentication** in the system yet, so there is no way to list a user's past/future trips. As a result:
- The header's "My trips" nav item now opens a **Find booking** screen (booking reference + last name) → a **Booking found** result screen with "Cancel booking" and "Change booking" actions. There is no dashboard/list of trips — every visit starts from a fresh lookup.
- The header's "Check-in" nav item is hidden — redundant with "My trips," since both would use the same find-by-reference lookup. Restore as a distinct nav item only if check-in gets its own dedicated flow/UI in the future.
- When user accounts/auth ship, evolve "My trips" into a real dashboard (bookings tied to the logged-in user, past + upcoming) that deep-links into this same booking-detail view. The screens are named `isManage` / `isManageResult` in the component state — a natural extension point for that future list.

The header's **"Help" nav item** is hidden — no help/support destination exists yet. Restore once one does.

The header's **currency selector ("GBP £") and user avatar ("JD")** are hidden — the current API has no user authentication and no multi-currency support (GBP only). Restore both once accounts and multi-currency pricing ship.

The **Passengers field** on the Search screen is hidden — the booking API currently only supports a single passenger per flight (search grid is now 3 columns: From / To / Depart). "Fare (1 adult)" line items elsewhere (Details/Passenger/Payment summaries) are left as-is since they're accurate for single-passenger bookings today. Restore the Passengers selector, and extend passenger-count logic through fare pricing, seat selection (one seat per passenger), and payment, when multi-passenger booking ships.

The **Stops filter** on Search Results is hidden, and the results list only shows direct flights — the booking API currently only returns direct itineraries. The former 1-stop/connecting flight was swapped for a direct one at the same price to preserve a "Cheapest" option; the results count is now computed live ("N direct flights found"). Restore the Stops filter and allow connecting flights in results when multi-stop/connecting itineraries ship.

The **Best / Cheapest / Fastest sort bar** above the results list is hidden — sorting isn't supported by the booking API yet; flights display in the order the API returns them. The "Best"/"Cheapest"/"Fastest" tag chips on individual flight cards are unrelated and stay as-is. Restore the sort bar when server-side sort options ship.

## Interactions & Behavior
- Search → clicking "Search flights" navigates to Results.
- Results → "Select" on any flight card navigates to Details with that flight loaded.
- Details → selecting a fare card updates the active state; "Continue" navigates to Passengers.
- Passengers → "Continue to seats" navigates to Seats.
- Seats → clicking any non-occupied seat selects it (updates seat readout, price, and running total live); "Continue to payment" navigates to Payment.
- Payment → "Pay £X" navigates to Confirmation.
- Confirmation → "Back to home" returns to Search.
- My trips → "Find booking" navigates to the found-booking result. A small "Preview: booking not found" link below the form (prototype-only affordance, not real product copy) triggers the not-found error state inline on the same screen instead — a red banner reading "We couldn't find a booking with that reference and last name. Please check and try again." Implement the real trigger as an actual failed API lookup, not a manual toggle.
- Logo/wordmark in header always navigates back to Search.
- No animated transitions between screens in the prototype (instant swap) — add whatever transition fits the app's existing navigation pattern.
- No loading states are modeled; the developer should add them per the app's existing conventions (e.g. skeleton states for results, inline validation errors for passenger/payment forms).

## State Management
- Current screen/step.
- Selected flight (id, times, duration, stops, fare price, computed total).
- Selected fare class (Economy Saver / Economy Flex / Business).
- Selected seat (row/col, extra-legroom flag, seat price).
- Passenger + payment form values (not modeled in the prototype — plan real reactive forms with validation).
- Running total recomputed from fare + seat + fixed £62 taxes/fees.

## Design Tokens

**Colors**
- Navy (ink / primary text / dark surfaces): `#0B1E3D`
- Navy secondary: `#12305C`, `#1A3F73`, `#1A3561`
- Primary blue: `#2180E0`
- Blue accent / hover: `#3B9EFF`
- Blue tint bg: `#EAF3FD`
- Muted text: `#5C6B84`
- Faint text / placeholders: `#8A99B3`, `#B4BECE`
- Border: `#E4E9F2`
- App background: `#F4F6FB`
- Surface: `#FFFFFF`
- Success green: `#1F9D6B` / `#22B07D`
- Success tint bg: `#DDF0E8`
- Warm accent (deals/popular tag only): `#F2A03D`

**Typography**
- Font: Hanken Grotesk (400/500/600/700/800), fallback `system-ui, sans-serif`
- Hero H1: 52px / 800 / -0.03em letter-spacing / 1.04 line-height
- Section H2: 26px / 800 / -0.02em
- Card headings: 19–20px / 800
- Body: 14–15px / 400–500
- Small labels/eyebrows: 12–13px / 600–700, uppercase, 0.06–0.14em letter-spacing
- Big numerics (prices, times, totals): 22–32px / 800 / -0.02em

**Spacing / Radius**
- Container max-width: 1180px, 24px side padding
- Card radius: 16–22px; input/button radius: 10–12px; pill radius: 999px
- Section vertical rhythm: 22–72px depending on hierarchy

**Shadows**
- Card: `0 1px 2px rgba(11,30,61,.04), 0 12px 28px rgba(11,30,61,.06)`
- Elevated card/search bar: `0 1px 2px rgba(11,30,61,.05), 0 24px 60px rgba(11,30,61,.16)`
- Primary button: `0 8px 20px rgba(33,128,224,.28–.32)`

## Assets
- **Logo**: inline SVG lettermark (navy circle badge, white "A" negative-space monogram, two blue wing shapes), supplied by the user (`uploads/aeronuk-avatar (1).svg`). Reused inline at multiple sizes (header 38px, flight-card 34px, footer/confirmation 40px) rather than as an image file — recreate as an SVG asset/icon component in the app.
- **Destination/photo imagery**: represented as striped placeholder blocks with monospace labels (e.g. "city / beach photo") — replace with real photography before ship.
- Google Font: Hanken Grotesk, loaded via Google Fonts `<link>`.

## Files
- `AeroNUK Booking.dc.html` — the full clickable design reference (all 7 screens + persistent header/stepper/footer).
