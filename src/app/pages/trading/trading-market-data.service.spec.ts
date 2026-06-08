import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { UTCTimestamp } from 'lightweight-charts';
import type { TradeableAsset } from './trading-asset-catalog';
import { TradingMarketDataService } from './trading-market-data.service';

const btcAsset: TradeableAsset = {
  id: 'crypto-btcusdt',
  symbol: 'BTCUSDT',
  displayName: 'Bitcoin / Tether',
  category: 'crypto',
  provider: 'binance',
  exchange: 'Binance Spot',
  assetType: 'crypto',
};

const teslaAsset: TradeableAsset = {
  id: 'stock-tsla',
  symbol: 'TSLA',
  displayName: 'Tesla',
  category: 'stock',
  provider: 'twelve-data',
  exchange: 'NASDAQ',
  assetType: 'stock',
};

const sp500Asset: TradeableAsset = {
  id: 'index-sp500',
  symbol: 'SP500',
  backendSymbol: '^GSPC',
  displayName: 'S&P 500',
  category: 'index',
  provider: 'yahoo',
  exchange: 'US Indexes',
  assetType: 'index',
};

const qqqEtfAsset: TradeableAsset = {
  id: 'etf-qqq',
  symbol: 'QQQ',
  displayName: 'Invesco QQQ Trust',
  category: 'etf',
  provider: 'twelve-data',
  exchange: 'NASDAQ',
  assetType: 'etf',
};

describe('TradingMarketDataService', () => {
  const backendBaseUrl = globalThis.location.origin;
  let httpMock: HttpTestingController;
  let service: TradingMarketDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TradingMarketDataService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should build the Binance backend URL for crypto assets', () => {
    expect(service.buildMarketDataUrl(btcAsset).href).toBe(
      `${backendBaseUrl}/market-data/binance/BTCUSDT?interval=1d&limit=90`,
    );
  });

  it('should build the Twelve Data backend URL for stock assets with the larger candle window and no pre/post market data', () => {
    expect(service.buildMarketDataUrl(teslaAsset).href).toBe(
      `${backendBaseUrl}/market-data/twelve-data/TSLA?interval=1day&outputsize=1000&exchange=NASDAQ&asset_type=stock&prepost=false`,
    );
  });

  it('should build the Twelve Data backend URL for ETF assets with the larger candle window', () => {
    expect(service.buildMarketDataUrl(qqqEtfAsset).href).toBe(
      `${backendBaseUrl}/market-data/twelve-data/QQQ?interval=1day&outputsize=1000&exchange=NASDAQ&asset_type=etf`,
    );
  });

  it('should build the Yahoo backend URL using backend symbols when present', () => {
    expect(service.buildMarketDataUrl(sp500Asset).href).toBe(
      `${backendBaseUrl}/market-data/yahoo/%5EGSPC?period=3mo&interval=1d`,
    );
  });

  it('should build the NASDAQ common stocks backend URL', () => {
    expect(service.buildNasdaqCommonStocksUrl().href).toBe(
      `${backendBaseUrl}/market-data/twelve-data/stocks?exchange=NASDAQ&country=United%20States&type=Common%20Stock`,
    );
  });

  it('should build the Twelve Data symbol search backend URL', () => {
    expect(service.buildTwelveDataSymbolSearchUrl(' ts ').href).toBe(
      `${backendBaseUrl}/market-data/twelve-data/symbol-search?q=ts`,
    );
  });

  it('should map Twelve Data symbol search results into stock assets', async () => {
    const stocksPromise = service.searchTwelveDataSymbols('ts');
    const request = httpMock.expectOne('/market-data/twelve-data/symbol-search?q=ts');
    request.flush({
      provider: 'twelve-data',
      symbols: [
        {
          symbol: 'TSLA',
          name: null,
          instrument_name: 'Tesla, Inc.',
          exchange: 'NASDAQ',
          country: 'United States',
          type: null,
        },
      ],
    });

    await expect(stocksPromise).resolves.toEqual([
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
  });

  it('should map NASDAQ common stocks from the backend list endpoint', async () => {
    const stocksPromise = service.loadNasdaqCommonStocks();
    const request = httpMock.expectOne(
      '/market-data/twelve-data/stocks?exchange=NASDAQ&country=United%20States&type=Common%20Stock',
    );
    request.flush({
      provider: 'twelve-data',
      stocks: [
        {
          symbol: ' aapl ',
          name: ' Apple Inc. ',
          exchange: 'NASDAQ',
          country: 'United States',
          type: 'Common Stock',
        },
      ],
    });

    await expect(stocksPromise).resolves.toEqual([
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
  });

  it('should return an empty stock list when the backend stock request fails', async () => {
    const stocksPromise = service.loadNasdaqCommonStocks();
    const request = httpMock.expectOne(
      '/market-data/twelve-data/stocks?exchange=NASDAQ&country=United%20States&type=Common%20Stock',
    );
    request.error(new ProgressEvent('network unavailable'));

    await expect(stocksPromise).resolves.toEqual([]);
  });

  it('should map backend candles to candlestick and volume data', () => {
    const mapped = service.mapBackendMarketData({
      provider: 'binance',
      symbol: 'BTCUSDT',
      interval: '1d',
      candles: [
        {
          timestamp: '2026-01-01T00:00:00Z',
          open: 100.5,
          high: 110.25,
          low: 95,
          close: 108.75,
          volume: 1234.56,
        },
      ],
    });

    expect(mapped.candles).toEqual([
      {
        time: (Date.UTC(2026, 0, 1) / 1000) as UTCTimestamp,
        open: 100.5,
        high: 110.25,
        low: 95,
        close: 108.75,
      },
    ]);
    expect(mapped.volumes).toEqual([
      {
        time: (Date.UTC(2026, 0, 1) / 1000) as UTCTimestamp,
        value: 1234.56,
        color: 'rgba(34, 197, 94, 0.35)',
      },
    ]);
  });

  it('should sort backend candles chronologically for Lightweight Charts', () => {
    const mapped = service.mapBackendMarketData({
      provider: 'twelve-data',
      symbol: 'TSLA',
      interval: '1day',
      candles: [
        {
          timestamp: '2026-01-03T00:00:00Z',
          open: 120,
          high: 125,
          low: 115,
          close: 118,
          volume: 3000,
        },
        {
          timestamp: '2026-01-01T00:00:00Z',
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 1000,
        },
        {
          timestamp: '2026-01-02T00:00:00Z',
          open: 105,
          high: 121,
          low: 104,
          close: 120,
          volume: 2000,
        },
      ],
    });

    expect(mapped.candles.map((candle) => candle.time)).toEqual([
      (Date.UTC(2026, 0, 1) / 1000) as UTCTimestamp,
      (Date.UTC(2026, 0, 2) / 1000) as UTCTimestamp,
      (Date.UTC(2026, 0, 3) / 1000) as UTCTimestamp,
    ]);
    expect(mapped.volumes.map((volume) => volume.value)).toEqual([1000, 2000, 3000]);
  });

  it('should ignore invalid backend candles', () => {
    const mapped = service.mapBackendMarketData({
      provider: 'binance',
      symbol: 'BTCUSDT',
      interval: '1d',
      candles: [
        {
          timestamp: 'not-a-date',
          open: Number.NaN,
          high: 110,
          low: 95,
          close: 108,
          volume: 1234,
        },
      ],
    });

    expect(mapped).toEqual({ candles: [], volumes: [] });
  });

  it('should return backend data when the request succeeds', async () => {
    const dataPromise = service.loadAssetChartData(teslaAsset);
    const request = httpMock.expectOne(
      '/market-data/twelve-data/TSLA?interval=1day&outputsize=1000&exchange=NASDAQ&asset_type=stock&prepost=false',
    );
    request.flush({
      provider: 'twelve-data',
      symbol: 'TSLA',
      interval: '1day',
      candles: [
        {
          timestamp: '2026-01-01T00:00:00Z',
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 2000,
        },
      ],
    });

    const data = await dataPromise;
    expect(data.source).toBe('twelve-data');
    expect(data.candles).toHaveLength(1);
    expect(data.volumes).toHaveLength(1);
  });

  it('should reject backend data that does not match the requested asset', async () => {
    const dataPromise = service.loadAssetChartData(teslaAsset);
    const request = httpMock.expectOne(
      '/market-data/twelve-data/TSLA?interval=1day&outputsize=1000&exchange=NASDAQ&asset_type=stock&prepost=false',
    );
    request.flush({
      provider: 'binance',
      symbol: 'BTCUSDT',
      interval: '1d',
      candles: [
        {
          timestamp: '2026-01-01T00:00:00Z',
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 2000,
        },
      ],
    });

    const data = await dataPromise;

    expect(data).toEqual({ candles: [], volumes: [], source: 'unavailable' });
  });

  it('should return unavailable data when the backend request fails', async () => {
    const dataPromise = service.loadAssetChartData(btcAsset);
    const request = httpMock.expectOne('/market-data/binance/BTCUSDT?interval=1d&limit=90');
    request.error(new ProgressEvent('network unavailable'));

    const data = await dataPromise;

    expect(data).toEqual({ candles: [], volumes: [], source: 'unavailable' });
  });
});
