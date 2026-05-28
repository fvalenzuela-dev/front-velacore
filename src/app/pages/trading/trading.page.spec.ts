import { TestBed } from '@angular/core/testing';
import { TradingPage } from './trading.page';

describe('TradingPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingPage],
    }).compileComponents();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(TradingPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose the page title used by the template', () => {
    const fixture = TestBed.createComponent(TradingPage);
    const component = fixture.componentInstance as unknown as { pageTitle: string };

    expect(component.pageTitle).toBe('Trading');
  });

  it('should render the trading page title and placeholder copy', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostElement = fixture.nativeElement as HTMLElement;
    const headings = Array.from(hostElement.querySelectorAll('h2'));

    expect(headings.map((heading) => heading.textContent?.trim())).toEqual(['Trading']);
    expect(hostElement.textContent).toContain('This section is ready for future trading workflows.');
  });
});
