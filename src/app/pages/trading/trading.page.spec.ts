import { TestBed } from '@angular/core/testing';
import type { UTCTimestamp } from 'lightweight-charts';
import { TradingPage } from './trading.page';
import { TradingAssetSelectionService } from './trading-asset-selection.service';
import { TradingMarketDataService, type TradingChartData } from './trading-market-data.service';

const chartMocks = vi.hoisted(() => {
  const candleSeries = { setData: vi.fn() };
  const volumeSeries = { setData: vi.fn() };
  const fitContent = vi.fn();
  const priceScaleApplyOptions = vi.fn();
  const resize = vi.fn();
  const remove = vi.fn();
  const observe = vi.fn();
  const disconnect = vi.fn();

  return {
    candleSeries,
    volumeSeries,
    fitContent,
    priceScaleApplyOptions,
    resize,
    remove,
    observe,
    disconnect,
    addSeries: vi.fn().mockReturnValueOnce(candleSeries).mockReturnValueOnce(volumeSeries),
    priceScale: vi.fn(() => ({ applyOptions: priceScaleApplyOptions })),
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
  let loadAssetChartData: ReturnType<typeof vi.fn>;
  let loadNasdaqCommonStocks: ReturnType<typeof vi.fn>;
  let searchTwelveDataSymbols: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    chartMocks.addSeries.mockClear();
    chartMocks.addSeries
      .mockReturnValueOnce(chartMocks.candleSeries)
      .mockReturnValueOnce(chartMocks.volumeSeries);
    chartMocks.candleSeries.setData.mockClear();
    chartMocks.volumeSeries.setData.mockClear();
    chartMocks.fitContent.mockClear();
    chartMocks.priceScaleApplyOptions.mockClear();
    chartMocks.resize.mockClear();
    chartMocks.remove.mockClear();
    chartMocks.observe.mockClear();
    chartMocks.disconnect.mockClear();
    chartMocks.createChart.mockClear();
    chartMocks.priceScale.mockClear();
    ResizeObserverMock.current = undefined;
    loadAssetChartData = vi.fn().mockResolvedValue(chartData);
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
      {
        id: 'stock-aapl-nasdaq',
        symbol: 'AAPL',
        displayName: 'Apple Inc.',
        category: 'stock',
        provider: 'twelve-data',
        exchange: 'NASDAQ',
        assetType: 'stock',
      },
    ]);
    searchTwelveDataSymbols = vi.fn().mockResolvedValue([
      {
        id: 'stock-tsla-nasdaq',
        symbol: 'TSLA',
        displayName: 'Tesla, Inc.',
        category: 'stock',
        provider: 'twelve-data',
        exchange: 'NASDAQ',
        assetType: 'stock',
      },
    ]);

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    await TestBed.configureTestingModule({
      imports: [TradingPage],
      providers: [
        {
          provide: TradingMarketDataService,
          useValue: { loadAssetChartData, loadNasdaqCommonStocks, searchTwelveDataSymbols },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(TradingPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the trading chart layout without a page-level asset selector overlay', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();

    const hostHTMLElement = fixture.nativeElement as HTMLElement;
    const chartContainer = hostHTMLElement.querySelector(
      '[aria-label="Trading candlestick chart with volume histogram"]',
    );
    const selectorTrigger = hostHTMLElement.querySelector('[aria-haspopup="dialog"]');

    expect(Boolean(hostHTMLElement.querySelector('h2'))).toBe(false);
    expect(Boolean(selectorTrigger)).toBe(false);
    expect(Boolean(chartContainer)).toBe(true);
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
    expect(loadAssetChartData).toHaveBeenCalledOnce();
    expect(loadAssetChartData.mock.calls[0][0]).toMatchObject({ symbol: 'BTCUSDT' });
    expect(chartMocks.candleSeries.setData).toHaveBeenCalledWith(chartData.candles);
    expect(chartMocks.volumeSeries.setData).toHaveBeenCalledWith(chartData.volumes);
    expect(chartMocks.priceScale).toHaveBeenCalledWith('right');
    expect(chartMocks.priceScaleApplyOptions).toHaveBeenCalledWith({ autoScale: true });
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

  it('should load chart data when the shared selected asset changes', async () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const assetSelection = TestBed.inject(TradingAssetSelectionService);
    const teslaAsset = {
      id: 'stock-tsla-nasdaq',
      symbol: 'TSLA',
      displayName: 'Tesla Inc.',
      category: 'stock',
      provider: 'twelve-data',
      exchange: 'NASDAQ',
      assetType: 'stock',
    } as const;

    assetSelection.selectAsset(teslaAsset);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as unknown as {
      selectedAsset: { symbol: string; displayName: string };
    };
    expect(component.selectedAsset.symbol).toBe('TSLA');
    expect(component.selectedAsset.displayName).toBe('Tesla Inc.');
    expect(loadAssetChartData).toHaveBeenCalledTimes(2);
    expect(loadAssetChartData.mock.calls[1][0]).toMatchObject({
      symbol: 'TSLA',
      provider: 'twelve-data',
      assetType: 'stock',
    });
  });

  it('should ignore stale chart data responses after selecting another asset', async () => {
    const staleBitcoinData: TradingChartData = {
      source: 'binance',
      candles: [{ time: 1_767_225_600 as UTCTimestamp, open: 10, high: 12, low: 9, close: 11 }],
      volumes: [
        { time: 1_767_225_600 as UTCTimestamp, value: 100, color: 'rgba(34, 197, 94, 0.35)' },
      ],
    };
    const teslaData: TradingChartData = {
      source: 'twelve-data',
      candles: [
        { time: 1_767_312_000 as UTCTimestamp, open: 200, high: 220, low: 190, close: 215 },
      ],
      volumes: [
        { time: 1_767_312_000 as UTCTimestamp, value: 300, color: 'rgba(34, 197, 94, 0.35)' },
      ],
    };
    let resolveBitcoinData: VoidFunction = vi.fn();
    let resolveTeslaData: VoidFunction = vi.fn();
    loadAssetChartData
      .mockReturnValueOnce(
        new Promise<TradingChartData>((resolve) => {
          resolveBitcoinData = function resolveStaleBitcoinData(): void {
            resolve(staleBitcoinData);
          };
        }),
      )
      .mockReturnValueOnce(
        new Promise<TradingChartData>((resolve) => {
          resolveTeslaData = function resolveSelectedTeslaData(): void {
            resolve(teslaData);
          };
        }),
      );

    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    const assetSelection = TestBed.inject(TradingAssetSelectionService);
    assetSelection.selectAsset({
      id: 'stock-tsla-nasdaq',
      symbol: 'TSLA',
      displayName: 'Tesla Inc.',
      category: 'stock',
      provider: 'twelve-data',
      exchange: 'NASDAQ',
      assetType: 'stock',
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as { isChartLoading: boolean };
    expect(chartMocks.candleSeries.setData).toHaveBeenLastCalledWith([]);
    expect(chartMocks.volumeSeries.setData).toHaveBeenLastCalledWith([]);
    expect(component.isChartLoading).toBe(true);

    resolveTeslaData();
    await fixture.whenStable();
    expect(chartMocks.candleSeries.setData).toHaveBeenCalledWith(teslaData.candles);

    resolveBitcoinData();
    await fixture.whenStable();
    expect(chartMocks.candleSeries.setData).not.toHaveBeenCalledWith(staleBitcoinData.candles);
  });

  it('should mark unavailable state when selected market data cannot be loaded', async () => {
    loadAssetChartData.mockResolvedValueOnce({ candles: [], volumes: [], source: 'unavailable' });
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as { loadError: boolean };
    const fallbackNotice = (fixture.nativeElement as HTMLElement).querySelector('.text-warning');

    expect(component.loadError).toBe(true);
    expect(fallbackNotice?.textContent).toContain('Market data could not be loaded');
  });

  it('should not apply async chart data after the component is destroyed', async () => {
    let resolveData: VoidFunction = vi.fn();
    loadAssetChartData.mockReturnValueOnce(
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
    expect(chartMocks.candleSeries.setData).toHaveBeenCalledWith([]);
    expect(chartMocks.volumeSeries.setData).toHaveBeenCalledWith([]);
    expect(chartMocks.candleSeries.setData).not.toHaveBeenCalledWith(chartData.candles);
    expect(chartMocks.volumeSeries.setData).not.toHaveBeenCalledWith(chartData.volumes);
    expect(chartMocks.fitContent).not.toHaveBeenCalled();
  });
});
