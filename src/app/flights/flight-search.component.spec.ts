import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { FlightSearchComponent } from './flight-search.component';
import { SearchStateService } from '../shared/services/search-state.service';

/** Formats a Date using its local (not UTC) year/month/day as YYYY-MM-DD. */
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TODAY = toLocalDateString(new Date());
const YESTERDAY = toLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
const TOMORROW = toLocalDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
const FUTURE_DATE = '2099-12-25';

describe('FlightSearchComponent', () => {
  let fixture: ComponentFixture<FlightSearchComponent>;
  let component: FlightSearchComponent;
  let router: Router;
  let searchState: SearchStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightSearchComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture     = TestBed.createComponent(FlightSearchComponent);
    component   = fixture.componentInstance;
    router      = TestBed.inject(Router);
    searchState = TestBed.inject(SearchStateService);
    fixture.detectChanges();
  });

  it('starts with an empty origin field by default', () => {
    expect(component.originCode()).toBe('');
  });

  it('shows an error and does not navigate when origin is missing', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.originCode.set('');
    component.destinationCode.set('JFK');
    component.date.set('2025-07-14');

    component.search();

    expect(component.searchError()).toContain('origin');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('shows an error and does not navigate when destination is missing', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.destinationCode.set('');
    component.date.set('2025-07-14');

    component.search();

    expect(component.searchError()).toContain('destination');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('shows an error and does not navigate when date is missing', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.destinationCode.set('JFK');
    component.date.set('');

    component.search();

    expect(component.searchError()).toContain('departure date');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('swap() exchanges origin and destination and bumps the rotation signal', () => {
    component.originCode.set('LHR');
    component.destinationCode.set('JFK');

    component.swap();

    expect(component.originCode()).toBe('JFK');
    expect(component.destinationCode()).toBe('LHR');
    expect(component.swapRotation()).toBe(180);
  });

  it('on valid submit stores the search and navigates to /flights/results', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.originCode.set('LHR');
    component.destinationCode.set('JFK');
    component.date.set(FUTURE_DATE);

    component.search();

    expect(component.searchError()).toBe('');
    expect(searchState.origin()).toBe('LHR');
    expect(searchState.destination()).toBe('JFK');
    expect(searchState.date()).toBe(FUTURE_DATE);
    expect(navigateSpy).toHaveBeenCalledWith(['/flights/results']);
  });

  it('shows an error and does not navigate when the departure date is in the past', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.originCode.set('LHR');
    component.destinationCode.set('JFK');
    component.date.set(YESTERDAY);

    component.search();

    expect(component.searchError()).toContain('today or later');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('accepts today\'s date and navigates to /flights/results', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.originCode.set('LHR');
    component.destinationCode.set('JFK');
    component.date.set(TODAY);

    component.search();

    expect(component.searchError()).toBe('');
    expect(searchState.date()).toBe(TODAY);
    expect(navigateSpy).toHaveBeenCalledWith(['/flights/results']);
  });

  it('accepts a future date and navigates to /flights/results', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.originCode.set('LHR');
    component.destinationCode.set('JFK');
    component.date.set(TOMORROW);

    component.search();

    expect(component.searchError()).toBe('');
    expect(searchState.date()).toBe(TOMORROW);
    expect(navigateSpy).toHaveBeenCalledWith(['/flights/results']);
  });

  it('does not flag attemptedSearch before any search has been submitted', () => {
    expect(component.attemptedSearch()).toBe(false);
  });

  it('sets attemptedSearch to true once a search is submitted with a missing field', () => {
    component.destinationCode.set('');
    component.date.set('2025-07-14');

    component.search();

    expect(component.attemptedSearch()).toBe(true);
  });

  it('does not render error-text on the destination placeholder before a search is attempted', () => {
    component.destinationCode.set('');
    fixture.detectChanges();

    const placeholder: HTMLElement = fixture.nativeElement.querySelector('#destination-select')
      .previousElementSibling;
    expect(placeholder.classList).not.toContain('error-text');
  });

  it('renders error-text on the destination placeholder after a failed search attempt', () => {
    component.destinationCode.set('');
    component.date.set('2025-07-14');

    component.search();
    fixture.detectChanges();

    const placeholder: HTMLElement = fixture.nativeElement.querySelector('#destination-select')
      .previousElementSibling;
    expect(placeholder.classList).toContain('error-text');
  });

  it('does not render error-text on the origin placeholder before a search is attempted', () => {
    fixture.detectChanges();

    const placeholder: HTMLElement = fixture.nativeElement.querySelector('#origin-select')
      .previousElementSibling;
    expect(placeholder.classList).not.toContain('error-text');
  });

  it('renders error-text on the origin placeholder after a failed search attempt', () => {
    component.originCode.set('');
    component.destinationCode.set('JFK');
    component.date.set('2025-07-14');

    component.search();
    fixture.detectChanges();

    const placeholder: HTMLElement = fixture.nativeElement.querySelector('#origin-select')
      .previousElementSibling;
    expect(placeholder.classList).toContain('error-text');
  });

  it('selectDestination() stores the destination and navigates to /flights/results', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.selectDestination({
      city: 'Barcelona', code: 'BCN', airport: 'El Prat', price: '£78', imageLabel: 'city / beach photo',
    });

    expect(searchState.destination()).toBe('BCN');
    expect(searchState.destinationCity()).toBe('Barcelona');
    expect(navigateSpy).toHaveBeenCalledWith(['/flights/results']);
  });

  it('renders the From, To and Depart field boxes at an identical height when empty', () => {
    const heights = Array.from(
      fixture.nativeElement.querySelectorAll('.search-field-box') as NodeListOf<HTMLElement>,
    ).map((box) => box.getBoundingClientRect().height);

    expect(heights.length).toBe(3);
    expect(heights[1]).toBe(heights[0]);
    expect(heights[2]).toBe(heights[0]);
  });

  it('renders the From, To and Depart field boxes at an identical height when filled', () => {
    component.originCode.set('LHR');
    component.destinationCode.set('JFK');
    component.date.set('2025-07-14');
    fixture.detectChanges();

    const heights = Array.from(
      fixture.nativeElement.querySelectorAll('.search-field-box') as NodeListOf<HTMLElement>,
    ).map((box) => box.getBoundingClientRect().height);

    expect(heights.length).toBe(3);
    expect(heights[1]).toBe(heights[0]);
    expect(heights[2]).toBe(heights[0]);
  });

  it('stretches the Depart date input to cover the full field box, not just its own content line', () => {
    const box: HTMLElement = fixture.nativeElement.querySelector('.search-field-box:has(#depart-date)');
    const input: HTMLElement = fixture.nativeElement.querySelector('#depart-date');

    const boxRect = box.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();

    // The input is absolutely positioned to fill its box (position: absolute;
    // inset: 0), so its own hit area should span virtually the whole box --
    // within a couple of pixels for the box's own border -- not shrink down
    // to the height of just the visible date text (~25px).
    expect(boxRect.height - inputRect.height).toBeLessThan(4);
    expect(boxRect.width - inputRect.width).toBeLessThan(4);
  });

  it('resolves a click anywhere in the Depart box -- including over the hint text and side padding -- to the date input', () => {
    const box: HTMLElement = fixture.nativeElement.querySelector('.search-field-box:has(#depart-date)');
    // The Karma browser's viewport is short enough that the search form can
    // sit below the fold; elementFromPoint only considers the current
    // viewport, so scroll the box into view before measuring it.
    box.scrollIntoView();
    const boxRect = box.getBoundingClientRect();

    const points = {
      'hint text (bottom-left)': { x: boxRect.left + 10, y: boxRect.bottom - 8 },
      'top padding': { x: boxRect.left + boxRect.width / 2, y: boxRect.top + 3 },
      'left padding': { x: boxRect.left + 2, y: boxRect.top + boxRect.height / 2 },
      'right padding': { x: boxRect.right - 2, y: boxRect.top + boxRect.height / 2 },
    };

    for (const [label, { x, y }] of Object.entries(points)) {
      const hit = document.elementFromPoint(x, y);
      expect(hit?.id).withContext(label).toBe('depart-date');
    }
  });

  it('opens the native date picker on click, not just focuses the input', () => {
    // Chrome only opens the calendar dropdown for clicks on the date
    // input's own value/icon sub-widget -- not for clicks anywhere within
    // its (stretched) box -- so being able to click-target #depart-date
    // (previous test) isn't enough on its own to guarantee the picker
    // actually opens. showPicker() is called explicitly from the click
    // handler to make that happen regardless of where in the box the click
    // lands; this asserts that call happens rather than relying on the
    // native popup itself, which isn't observable through the DOM.
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#depart-date');
    if (typeof input.showPicker !== 'function') {
      pending('showPicker() is not supported in this browser');
    }
    const showPickerSpy = spyOn(input, 'showPicker');

    input.click();

    expect(showPickerSpy).toHaveBeenCalled();
  });
});
