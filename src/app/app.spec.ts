import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { TradingMarketDataService } from './pages/trading/trading-market-data.service';

function findButtonByText(hostHTMLElement: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(hostHTMLElement.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button with text "${text}" was not found.`);
  }

  return button;
}

describe('App', () => {
  let loadNasdaqCommonStocks: ReturnType<typeof vi.fn>;
  let searchTwelveDataSymbols: ReturnType<typeof vi.fn>;
  let loadAssetChartData: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadNasdaqCommonStocks = vi.fn().mockResolvedValue([
      {
        id: 'stock-tsla-nasdaq',
        symbol: 'TSLA',
        displayName: 'Tesla Inc.',
        category: 'stock',
        provider: 'twelve-data',
        exchange: 'NASDAQ',
        assetType: 'stock',
      },
    ]);
    searchTwelveDataSymbols = vi.fn().mockResolvedValue([]);
    loadAssetChartData = vi.fn().mockResolvedValue({ candles: [], volumes: [], source: 'unavailable' });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: TradingMarketDataService,
          useValue: { loadAssetChartData, loadNasdaqCommonStocks, searchTwelveDataSymbols },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render top, left, and right shell bars with the VC menu in the top-left', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    const shell = hostHTMLElement.querySelector('main');
    const header = hostHTMLElement.querySelector('header');
    const menu = hostHTMLElement.querySelector('nav[aria-label="Main navigation"]');
    const trigger = hostHTMLElement.querySelector('nav > button');
    const floatingPanel = hostHTMLElement.querySelector('#main-navigation-menu');
    const topBar = hostHTMLElement.querySelector('[aria-label="Top bar"]');
    const assetSelector = topBar?.querySelector('[aria-haspopup="dialog"]');
    const leftBar = hostHTMLElement.querySelector('[aria-label="Left tools bar"]');
    const rightBar = hostHTMLElement.querySelector('[aria-label="Right tools bar"]');
    const contentGrid = hostHTMLElement.querySelector('main > section');
    const linkLabels = Array.from(hostHTMLElement.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );
    const linkHrefs = Array.from(hostHTMLElement.querySelectorAll('nav a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(shell?.classList.contains('grid-rows-[4rem_1fr]')).toBe(true);
    expect(header).toBeTruthy();
    expect(menu?.classList.contains('w-16')).toBe(true);
    expect(trigger?.textContent?.trim()).toBe('VC');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(floatingPanel?.classList.contains('absolute')).toBe(true);
    expect(floatingPanel?.classList.contains('pointer-events-none')).toBe(true);

    (trigger as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(floatingPanel?.classList.contains('opacity-100')).toBe(true);
    expect(floatingPanel?.classList.contains('pointer-events-auto')).toBe(true);

    document.body.click();
    fixture.detectChanges();

    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(floatingPanel?.classList.contains('pointer-events-none')).toBe(true);
    expect(topBar).toBeTruthy();
    expect(assetSelector?.textContent?.trim()).toBe('btcusdt');
    expect(leftBar).toBeTruthy();
    expect(rightBar).toBeTruthy();
    expect(contentGrid?.classList.contains('grid-cols-[4rem_1fr_4rem]')).toBe(true);
    expect(linkLabels).toEqual(['Dashboard', 'Trading']);
    expect(linkHrefs).toEqual(['/dashboard', '/trading']);
  });

  it('should open the asset selector popup from the top bar and restore focus on close', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    const topBarAssetSelector = hostHTMLElement.querySelector(
      '[aria-label="Top bar"] [aria-haspopup="dialog"]',
    );

    expect(topBarAssetSelector?.textContent?.trim()).toBe('btcusdt');
    (topBarAssetSelector as HTMLButtonElement).click();
    fixture.detectChanges();

    const closeButton = hostHTMLElement.querySelector('[aria-label="Close asset selector"]');
    expect(hostHTMLElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(hostHTMLElement.textContent).toContain('Choose an asset');
    expect(hostHTMLElement.textContent).toContain('Cryptocurrencies');
    expect(document.activeElement).toBe(closeButton);

    (closeButton as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(hostHTMLElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(topBarAssetSelector);
  });

  it('should update the top-bar selected asset text after selecting an asset', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    findButtonByText(hostHTMLElement, 'btcusdt').click();
    fixture.detectChanges();
    findButtonByText(hostHTMLElement, 'Stocks').click();
    fixture.detectChanges();

    expect(loadNasdaqCommonStocks).toHaveBeenCalledOnce();
    expect(hostHTMLElement.textContent).toContain('Loading NASDAQ common stocks');

    await fixture.whenStable();
    fixture.detectChanges();

    const teslaOption = hostHTMLElement.querySelector('[aria-label="Select Tesla Inc. (TSLA)"]');
    expect(teslaOption).toBeTruthy();
    (teslaOption as HTMLButtonElement).click();
    fixture.detectChanges();

    const topBarAssetSelector = hostHTMLElement.querySelector(
      '[aria-label="Top bar"] [aria-haspopup="dialog"]',
    );
    expect(hostHTMLElement.querySelector('[role="dialog"]')).toBeNull();
    expect(topBarAssetSelector?.textContent?.trim()).toBe('tsla');
  });
});
