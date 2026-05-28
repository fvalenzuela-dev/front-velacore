import { Injectable } from '@angular/core';
import type { CandlestickData, HistogramData, UTCTimestamp } from 'lightweight-charts';

export type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export interface TradingChartData {
  candles: CandlestickData[];
  volumes: HistogramData[];
  source: 'binance' | 'fallback';
}

@Injectable({ providedIn: 'root' })
export class TradingMarketDataService {
  private readonly binanceKlinesUrl =
    'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=90';

  async loadBitcoinChartData(): Promise<TradingChartData> {
    try {
      const response = await fetch(this.binanceKlinesUrl);

      if (!response.ok) {
        throw new Error(`Binance request failed with ${response.status}`);
      }

      const klines = (await response.json()) as BinanceKline[];
      const mapped = this.mapBinanceKlines(klines);

      if (mapped.candles.length === 0) {
        throw new Error('Binance response did not contain valid candles');
      }

      return {
        ...mapped,
        source: 'binance',
      };
    } catch {
      return this.getFallbackChartData();
    }
  }

  mapBinanceKlines(klines: BinanceKline[]): Omit<TradingChartData, 'source'> {
    const candles: CandlestickData[] = [];
    const volumes: HistogramData[] = [];

    for (const kline of klines) {
      const time = Math.floor(kline[0] / 1000) as UTCTimestamp;
      const open = Number(kline[1]);
      const high = Number(kline[2]);
      const low = Number(kline[3]);
      const close = Number(kline[4]);
      const volume = Number(kline[5]);

      if (![open, high, low, close, volume].every(Number.isFinite)) {
        continue;
      }

      candles.push({ time, open, high, low, close });
      volumes.push({
        time,
        value: volume,
        color: close >= open ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      });
    }

    return { candles, volumes };
  }

  getFallbackChartData(): TradingChartData {
    const baseTime = Date.UTC(2026, 0, 1) / 1000;
    const fallbackCandles: Omit<CandlestickData, 'time'>[] = [
      { open: 93450, high: 96120, low: 92140, close: 95520 },
      { open: 95520, high: 97280, low: 94890, close: 96740 },
      { open: 96740, high: 98210, low: 95670, close: 96110 },
      { open: 96110, high: 98880, low: 95940, close: 98420 },
      { open: 98420, high: 100350, low: 97600, close: 99870 },
      { open: 99870, high: 101240, low: 98990, close: 100940 },
      { open: 100940, high: 102600, low: 99520, close: 100120 },
      { open: 100120, high: 101880, low: 98240, close: 99080 },
      { open: 99080, high: 100760, low: 97820, close: 100450 },
      { open: 100450, high: 103100, low: 99920, close: 102780 },
      { open: 102780, high: 104200, low: 101880, close: 103640 },
      { open: 103640, high: 105500, low: 102300, close: 104920 },
    ];

    const candles = fallbackCandles.map((candle, index) => ({
      ...candle,
      time: (baseTime + index * 86_400) as UTCTimestamp,
    }));
    const volumes = candles.map((candle, index) => ({
      time: candle.time,
      value: 18_000 + index * 1_750,
      color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
    }));

    return { candles, volumes, source: 'fallback' };
  }
}
