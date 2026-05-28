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

  it('should render the trading chart layout', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    const pageHTMLTextContent = hostHTMLElement.textContent ?? '';
    const chartContainer = hostHTMLElement.querySelector(
      '[aria-label="BTC candlestick chart with volume histogram"]',
    );

    expect(hostHTMLElement.querySelector('h2')).toBeNull();
    expect(pageHTMLTextContent).not.toContain('BTC/USDT market overview');
    expect(pageHTMLTextContent).not.toContain('Full-page TradingView-style chart');
    expect(pageHTMLTextContent).not.toContain('No private API keys, accounts, or order placement are used.');
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

  it('should surface fallback copy when Binance data is unavailable', async () => {
    loadBitcoinChartData.mockResolvedValueOnce({ ...chartData, source: 'fallback' });
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const pageHTMLTextContent = ((fixture.nativeElement as HTMLElement).textContent ?? '').trim();

    expect(pageHTMLTextContent).not.toContain('Static fallback data');
    expect(pageHTMLTextContent).toContain('Binance data could not be loaded');
  });

  it('should not apply async chart data after the component is destroyed', async () => {
    const resolverType = (chartDataToResolve: TradingChartData): void => {
      if (!chartDataToResolve) {
        throw new Error('Missing chart data');
      }
    };
    let resolveData: typeof resolverType = resolverType;
    loadBitcoinChartData.mockReturnValueOnce(
      new Promise<TradingChartData>((resolve) => {
        resolveData = resolve;
      }),
    );

    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    fixture.destroy();
    resolveData(chartData);
    await fixture.whenStable();

    expect(chartMocks.remove).toHaveBeenCalledOnce();
    expect(chartMocks.candleSeries.setData).not.toHaveBeenCalled();
    expect(chartMocks.volumeSeries.setData).not.toHaveBeenCalled();
    expect(chartMocks.fitContent).not.toHaveBeenCalled();
  });
});
