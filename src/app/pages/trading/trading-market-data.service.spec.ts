import { TestBed } from '@angular/core/testing';
import type { UTCTimestamp } from 'lightweight-charts';
import { TradingMarketDataService, type BinanceKline } from './trading-market-data.service';

describe('TradingMarketDataService', () => {
  let service: TradingMarketDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradingMarketDataService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should map Binance klines to candlestick and volume data', () => {
    const openTime = Date.UTC(2026, 0, 1);
    const klines: BinanceKline[] = [
      [openTime, '100.5', '110.25', '95', '108.75', '1234.56', openTime, '0', 10, '0', '0', '0'],
    ];

    const mapped = service.mapBinanceKlines(klines);

    expect(mapped.candles).toEqual([
      {
        time: Math.floor(openTime / 1000) as UTCTimestamp,
        open: 100.5,
        high: 110.25,
        low: 95,
        close: 108.75,
      },
    ]);
    expect(mapped.volumes).toEqual([
      {
        time: Math.floor(openTime / 1000) as UTCTimestamp,
        value: 1234.56,
        color: 'rgba(34, 197, 94, 0.35)',
      },
    ]);
  });

  it('should ignore invalid Binance klines', () => {
    const klines: BinanceKline[] = [
      [0, 'invalid', '110', '95', '108', '1234', 0, '0', 0, '0', '0', '0'],
    ];

    expect(service.mapBinanceKlines(klines)).toEqual({ candles: [], volumes: [] });
  });

  it('should return Binance data when the public request succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([[0, '100', '110', '90', '105', '2000', 0, '0', 0, '0', '0', '0']]),
      }),
    );

    const data = await service.loadBitcoinChartData();

    expect(data.source).toBe('binance');
    expect(data.candles).toHaveLength(1);
    expect(data.volumes).toHaveLength(1);
  });

  it('should fall back to static data when Binance fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));

    const data = await service.loadBitcoinChartData();

    expect(data.source).toBe('fallback');
    expect(data.candles.length).toBeGreaterThan(0);
    expect(data.volumes).toHaveLength(data.candles.length);
  });
});
