import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CandlestickData, HistogramData, UTCTimestamp } from 'lightweight-charts';
import type { TradeableAsset, TradeableAssetProvider } from './trading-asset-catalog';

export interface BackendMarketDataCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BackendMarketDataResponse {
  provider: TradeableAssetProvider;
  symbol: string;
  interval: string;
  range?: string | null;
  candles?: BackendMarketDataCandle[];
}

export interface BackendTwelveDataStock {
  symbol: string;
  name?: string | null;
  instrument_name?: string | null;
  exchange?: string | null;
  country?: string | null;
  type?: string | null;
}

export interface BackendTwelveDataStocksResponse {
  provider: 'twelve-data';
  stocks?: BackendTwelveDataStock[];
}

export interface BackendTwelveDataSymbolSearchResponse {
  provider: 'twelve-data';
  symbols?: BackendTwelveDataStock[];
}

export interface TradingChartData {
  candles: CandlestickData[];
  volumes: HistogramData[];
  source: TradeableAssetProvider | 'unavailable';
}

@Injectable({ providedIn: 'root' })
export class TradingMarketDataService {
  private readonly http = inject(HttpClient);
  private readonly backendBaseUrl = globalThis.location?.origin ?? 'http://localhost:4200';

  async loadNasdaqCommonStocks(): Promise<readonly TradeableAsset[]> {
    try {
      const stocksUrl = this.buildNasdaqCommonStocksUrl();
      const stockList = await firstValueFrom(
        this.http.get<BackendTwelveDataStocksResponse>(this.toAllowedBackendRequestPath(stocksUrl)),
      );
      return this.mapTwelveDataStockAssets(stockList.stocks ?? []);
    } catch {
      return [];
    }
  }

  async searchTwelveDataSymbols(query: string): Promise<readonly TradeableAsset[]> {
    try {
      const searchUrl = this.buildTwelveDataSymbolSearchUrl(query);
      const searchResults = await firstValueFrom(
        this.http.get<BackendTwelveDataSymbolSearchResponse>(
          this.toAllowedBackendRequestPath(searchUrl),
        ),
      );
      return this.mapTwelveDataStockAssets(searchResults.symbols ?? []);
    } catch {
      return [];
    }
  }

  async loadAssetChartData(asset: TradeableAsset): Promise<TradingChartData> {
    try {
      const marketDataUrl = this.buildMarketDataUrl(asset);
      const marketData = await firstValueFrom(
        this.http.get<BackendMarketDataResponse>(this.toAllowedBackendRequestPath(marketDataUrl)),
      );
      this.assertMarketDataMatchesAsset(marketData, asset);
      const mapped = this.mapBackendMarketData(marketData);

      if (mapped.candles.length === 0) {
        throw new Error('Market data response did not contain valid candles');
      }

      return {
        ...mapped,
        source: marketData.provider,
      };
    } catch {
      return this.getUnavailableChartData();
    }
  }

  buildNasdaqCommonStocksUrl(): URL {
    const url = new URL('/market-data/twelve-data/stocks', this.backendBaseUrl);
    url.search = 'exchange=NASDAQ&country=United%20States&type=Common%20Stock';
    return url;
  }

  buildTwelveDataSymbolSearchUrl(query: string): URL {
    const url = new URL('/market-data/twelve-data/symbol-search', this.backendBaseUrl);
    url.search = new URLSearchParams({ q: query.trim() }).toString();
    return url;
  }

  buildMarketDataUrl(asset: TradeableAsset): URL {
    const symbol = encodeURIComponent(asset.backendSymbol ?? asset.symbol);

    if (asset.provider === 'binance') {
      const url = new URL(`/market-data/binance/${symbol}`, this.backendBaseUrl);
      url.search = new URLSearchParams({ interval: '1d', limit: '90' }).toString();
      return url;
    }

    if (asset.provider === 'twelve-data') {
      const url = new URL(`/market-data/twelve-data/${symbol}`, this.backendBaseUrl);
      const params = new URLSearchParams({ interval: '1day', outputsize: '90' });

      if (asset.exchange) {
        params.set('exchange', asset.exchange);
      }

      if (asset.assetType === 'stock' || asset.assetType === 'etf') {
        params.set('asset_type', asset.assetType);
      }

      url.search = params.toString();
      return url;
    }

    const url = new URL(`/market-data/yahoo/${symbol}`, this.backendBaseUrl);
    url.search = new URLSearchParams({ period: '3mo', interval: '1d' }).toString();
    return url;
  }

  private mapTwelveDataStockAssets(
    stocks: readonly BackendTwelveDataStock[],
  ): readonly TradeableAsset[] {
    return stocks
      .filter((stock) => stock.symbol.trim().length > 0)
      .map((stock) => {
        const symbol = stock.symbol.trim().toUpperCase();
        const exchange = stock.exchange?.trim() || 'NASDAQ';
        return {
          id: `stock-${symbol.toLowerCase()}-${exchange.toLowerCase()}`,
          symbol,
          displayName: stock.name?.trim() || stock.instrument_name?.trim() || symbol,
          category: 'stock',
          provider: 'twelve-data',
          exchange,
          assetType: 'stock',
        } satisfies TradeableAsset;
      });
  }

  private assertMarketDataMatchesAsset(
    marketData: BackendMarketDataResponse,
    asset: TradeableAsset,
  ): void {
    const expectedSymbol = asset.backendSymbol ?? asset.symbol;

    if (marketData.provider !== asset.provider || marketData.symbol !== expectedSymbol) {
      throw new Error('Market data response did not match the requested asset');
    }
  }

  private toAllowedBackendRequestPath(url: URL): string {
    this.assertAllowedBackendUrl(url);
    return `${url.pathname}${url.search}`;
  }

  private assertAllowedBackendUrl(url: URL): void {
    const allowedOrigin = new URL(this.backendBaseUrl).origin;
    const allowedPathPrefixes = [
      '/market-data/binance/',
      '/market-data/twelve-data/',
      '/market-data/yahoo/',
    ];

    if (
      url.origin !== allowedOrigin ||
      !allowedPathPrefixes.some((pathPrefix) => url.pathname.startsWith(pathPrefix))
    ) {
      throw new Error('Blocked non-allowlisted market data URL');
    }
  }

  mapBackendMarketData(response: BackendMarketDataResponse): Omit<TradingChartData, 'source'> {
    const chartPoints: Array<{ candle: CandlestickData; volume: HistogramData }> = [];

    for (const candle of response.candles ?? []) {
      const timeInSeconds = Date.parse(candle.timestamp) / 1000;
      const open = Number(candle.open);
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      const volume = Number(candle.volume);

      if (![timeInSeconds, open, high, low, close, volume].every(Number.isFinite)) {
        continue;
      }

      const time = Math.floor(timeInSeconds) as UTCTimestamp;
      chartPoints.push({
        candle: { time, open, high, low, close },
        volume: {
          time,
          value: volume,
          color: close >= open ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        },
      });
    }

    chartPoints.sort((left, right) => Number(left.candle.time) - Number(right.candle.time));

    return {
      candles: chartPoints.map((point) => point.candle),
      volumes: chartPoints.map((point) => point.volume),
    };
  }

  getUnavailableChartData(): TradingChartData {
    return { candles: [], volumes: [], source: 'unavailable' };
  }
}
