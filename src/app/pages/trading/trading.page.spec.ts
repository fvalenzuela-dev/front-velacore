import { TestBed } from '@angular/core/testing';
import type { UTCTimestamp } from 'lightweight-charts';
import { TradingPage } from './trading.page';
import { TradingMarketDataService, type TradingChartData } from './trading-market-data.service';

const chartMocks = vi.hoisted(() => {
  const candleSeries = { setData: vi.fn() };
  const volumeSeries = { setData: vi.fn() };
  const fitContent = vi.fn();
  const resize = vi.fn();
  const remove = vi.fn();
  const observe = vi.fn();
  const disconnect = vi.fn();

  return {
    candleSeries,
    volumeSeries,
    fitContent,
    resize,
    remove,
    observe,
    disconnect,
    addSeries: vi.fn().mockReturnValueOnce(candleSeries).mockReturnValueOnce(volumeSeries),
    priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
    createChart: vi.fn(() => ({
      addSeries: chartMocks.addSeries,
      priceScale: chartMocks.priceScale,
      resize,
      remove,
      timeScale: () => ({ fitContent }),
    })),
  };
});

vi.mock('lightweight-charts', () => ({
  CandlestickSeries: 'CandlestickSeries',
  ColorType: { Solid: 'solid' },
  HistogramSeries: 'HistogramSeries',
  createChart: chartMocks.createChart,
}));

class ResizeObserverMock {
  static current?: ResizeObserverMock;

  private readonly observerCallback: ResizeObserverCallback;
  readonly observe = chartMocks.observe;
  readonly disconnect = chartMocks.disconnect;

  constructor(observerCallback: ResizeObserverCallback) {
    this.observerCallback = observerCallback;
    ResizeObserverMock.current = this;
  }

  trigger(width: number, height: number): void {
    this.observerCallback(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

const chartData: TradingChartData = {
  source: 'binance',
  candles: [{ time: 1_767_225_600 as UTCTimestamp, open: 100, high: 120, low: 95, close: 115 }],
  volumes: [{ time: 1_767_225_600 as UTCTimestamp, value: 1500, color: 'rgba(34, 197, 94, 0.35)' }],
};

function findButtonByText(hostHTMLElement: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(hostHTMLElement.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button with text "${text}" was not found.`);
  }

  return button;
}

describe('TradingPage', () => {
  let loadBitcoinChartData: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    chartMocks.addSeries.mockClear();
    chartMocks.addSeries
      .mockReturnValueOnce(chartMocks.candleSeries)
      .mockReturnValueOnce(chartMocks.volumeSeries);
    chartMocks.candleSeries.setData.mockClear();
    chartMocks.volumeSeries.setData.mockClear();
    chartMocks.fitContent.mockClear();
    chartMocks.resize.mockClear();
    chartMocks.remove.mockClear();
    chartMocks.observe.mockClear();
    chartMocks.disconnect.mockClear();
    chartMocks.createChart.mockClear();
    chartMocks.priceScale.mockClear();
    ResizeObserverMock.current = undefined;
    loadBitcoinChartData = vi.fn().mockResolvedValue(chartData);

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    await TestBed.configureTestingModule({
      imports: [TradingPage],
      providers: [{ provide: TradingMarketDataService, useValue: { loadBitcoinChartData } }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(TradingPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the trading chart layout with an asset selector trigger', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    const chartContainer = hostHTMLElement.querySelector(
      '[aria-label="Trading candlestick chart with volume histogram"]',
    );
    const selectorTrigger = hostHTMLElement.querySelector('[aria-haspopup="dialog"]');

    expect(hostHTMLElement.textContent).toContain('Selected asset');
    expect(hostHTMLElement.textContent).toContain('Bitcoin / Tether');
    expect(selectorTrigger?.textContent).toContain('Select asset');
    expect(chartContainer).toBeTruthy();
    expect(chartContainer?.classList.contains('h-full')).toBe(true);
    expect(chartContainer?.classList.contains('min-h-[calc(100vh-4rem)]')).toBe(true);
    expect(chartContainer?.classList.contains('rounded-2xl')).toBe(false);
  });

  it('should initialize candlestick and volume series with loaded data', async () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(chartMocks.createChart).toHaveBeenCalledOnce();
    expect(chartMocks.addSeries).toHaveBeenCalledTimes(2);
    expect(loadBitcoinChartData).toHaveBeenCalledOnce();
    expect(chartMocks.candleSeries.setData).toHaveBeenCalledWith(chartData.candles);
    expect(chartMocks.volumeSeries.setData).toHaveBeenCalledWith(chartData.volumes);
    expect(chartMocks.fitContent).toHaveBeenCalledOnce();
  });

  it('should resize with the observed container and clean up on destroy', async () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    await fixture.whenStable();

    ResizeObserverMock.current?.trigger(888.8, 444.4);
    fixture.destroy();

    expect(chartMocks.observe).toHaveBeenCalledOnce();
    expect(chartMocks.resize).toHaveBeenCalledWith(888, 444);
    expect(chartMocks.disconnect).toHaveBeenCalledOnce();
    expect(chartMocks.remove).toHaveBeenCalledOnce();
  });

  it('should open and close the asset selector popup', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    findButtonByText(hostHTMLElement, 'Select asset').click();
    fixture.detectChanges();

    expect(hostHTMLElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(hostHTMLElement.textContent).toContain('Choose an asset');
    expect(hostHTMLElement.textContent).toContain('Cryptocurrencies');
    expect(hostHTMLElement.textContent).toContain('Bitcoin / Tether');

    const closeButton = hostHTMLElement.querySelector('[aria-label="Close asset selector"]');
    expect(closeButton).toBeTruthy();
    expect(document.activeElement).toBe(closeButton);
    (closeButton as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(hostHTMLElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should close the asset selector with Escape and restore trigger focus', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    const selectorTrigger = findButtonByText(hostHTMLElement, 'Select asset');
    selectorTrigger.click();
    fixture.detectChanges();

    const dialog = hostHTMLElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(hostHTMLElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(selectorTrigger);
  });

  it('should switch asset categories in the selector', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    findButtonByText(hostHTMLElement, 'Select asset').click();
    fixture.detectChanges();

    expect(hostHTMLElement.textContent).toContain('Ethereum / Tether');
    expect(hostHTMLElement.textContent).not.toContain('Tesla');

    findButtonByText(hostHTMLElement, 'Stocks').click();
    fixture.detectChanges();

    expect(hostHTMLElement.textContent).toContain('Tesla');
    expect(hostHTMLElement.textContent).toContain('Apple');
    expect(hostHTMLElement.textContent).toContain('Microsoft');
    expect(hostHTMLElement.textContent).not.toContain('Ethereum / Tether');
  });

  it('should update the selected asset and close the popup after selection', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    findButtonByText(hostHTMLElement, 'Select asset').click();
    fixture.detectChanges();
    findButtonByText(hostHTMLElement, 'Stocks').click();
    fixture.detectChanges();

    const teslaOption = hostHTMLElement.querySelector('[aria-label="Select Tesla (TSLA)"]');
    expect(teslaOption).toBeTruthy();
    (teslaOption as HTMLButtonElement).click();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      selectedAsset: { symbol: string; displayName: string };
    };
    expect(component.selectedAsset.symbol).toBe('TSLA');
    expect(component.selectedAsset.displayName).toBe('Tesla');
    expect(hostHTMLElement.querySelector('[role="dialog"]')).toBeNull();
    expect(hostHTMLElement.textContent).toContain('Tesla');
    expect(hostHTMLElement.textContent).toContain('TSLA');
    expect(loadBitcoinChartData).toHaveBeenCalledOnce();
  });

  it('should mark fallback state when Binance data is unavailable', async () => {
    loadBitcoinChartData.mockResolvedValueOnce({ ...chartData, source: 'fallback' });
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as { loadError: boolean };
    const fallbackNotice = (fixture.nativeElement as HTMLElement).querySelector('.text-warning');

    expect(component.loadError).toBe(true);
    expect(fallbackNotice).toBeTruthy();
  });

  it('should not apply async chart data after the component is destroyed', async () => {
    let resolveData: VoidFunction = vi.fn();
    loadBitcoinChartData.mockReturnValueOnce(
      new Promise<TradingChartData>((resolve) => {
        resolveData = function resolveChartData(): void {
          resolve(chartData);
        };
      }),
    );

    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    fixture.destroy();
    resolveData();
    await fixture.whenStable();

    expect(chartMocks.remove).toHaveBeenCalledOnce();
    expect(chartMocks.candleSeries.setData).not.toHaveBeenCalled();
    expect(chartMocks.volumeSeries.setData).not.toHaveBeenCalled();
    expect(chartMocks.fitContent).not.toHaveBeenCalled();
  });
});
