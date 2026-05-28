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

    const headingTexts = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('h2'),
    ).map((heading) => heading.textContent?.trim());
    const paragraphTexts = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('p'),
    ).map((paragraph) => paragraph.textContent?.trim());

    expect(headingTexts).toEqual(['Trading']);
    expect(paragraphTexts).toContain('This section is ready for future trading workflows.');
  });
});
