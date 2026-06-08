import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TRADEABLE_ASSETS, type TradeableAsset } from './trading-asset-catalog';
import { TradingAssetSelectionService } from './trading-asset-selection.service';
import { TradingMarketDataService } from './trading-market-data.service';

const storageKey = 'velacore-trading-selected-asset';

const dynamicTeslaAsset: TradeableAsset = {
  id: 'stock-tsla-nasdaq',
  symbol: 'TSLA',
  displayName: 'Tesla, Inc.',
  category: 'stock',
  provider: 'twelve-data',
  exchange: 'NASDAQ',
  assetType: 'stock',
};

const staticAppleAsset = TRADEABLE_ASSETS.find((asset) => asset.id === 'stock-aapl');

if (!staticAppleAsset) {
  throw new Error('Expected stock-aapl fixture asset to exist');
}

describe('TradingAssetSelectionService', () => {
  let storage: Map<string, string>;
  let loadNasdaqCommonStocks: ReturnType<typeof vi.fn>;
  let searchTwelveDataSymbols: ReturnType<typeof vi.fn>;

  function configureService(): TradingAssetSelectionService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TradingMarketDataService,
          useValue: { loadNasdaqCommonStocks, searchTwelveDataSymbols },
        },
      ],
    });

    return TestBed.inject(TradingAssetSelectionService);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    storage = new Map<string, string>();
    loadNasdaqCommonStocks = vi.fn().mockResolvedValue([]);
    searchTwelveDataSymbols = vi.fn().mockResolvedValue([]);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('should persist the selected dynamic stock asset with a compact storage payload', () => {
    const service = configureService();

    service.selectAsset(dynamicTeslaAsset);

    expect(JSON.parse(storage.get(storageKey) ?? '{}')).toEqual({
      version: 1,
      dynamicStock: {
        id: 'stock-tsla-nasdaq',
        symbol: 'TSLA',
        displayName: 'Tesla, Inc.',
        exchange: 'NASDAQ',
      },
    });
    expect(service.selectedAsset()).toEqual(dynamicTeslaAsset);
  });

  it('should restore a valid persisted dynamic stock asset when the service is recreated', () => {
    storage.set(
      storageKey,
      JSON.stringify({
        version: 1,
        dynamicStock: {
          id: ' stock-tsla-nasdaq ',
          symbol: ' tsla ',
          displayName: ' Tesla, Inc. ',
          exchange: ' NASDAQ ',
          backendSymbol: 'ignored',
        },
      }),
    );

    const service = configureService();

    expect(service.selectedAsset()).toEqual(dynamicTeslaAsset);
    expect(service.selectedCategory()).toBe('stock');
    expect(service.selectedAssetText()).toBe('tsla');
  });

  it('should fall back to the default asset when persisted data is malformed', () => {
    storage.set(storageKey, '{not valid json');

    const service = configureService();

    expect(service.selectedAsset()).toEqual(TRADEABLE_ASSETS[0]);
    expect(service.selectedCategory()).toBe(TRADEABLE_ASSETS[0].category);
  });

  it('should fall back to the default asset when persisted data is stale', () => {
    storage.set(storageKey, JSON.stringify({ version: 1, assetId: 'crypto-dogeusdt' }));

    const service = configureService();

    expect(service.selectedAsset()).toEqual(TRADEABLE_ASSETS[0]);
    expect(service.selectedCategory()).toBe(TRADEABLE_ASSETS[0].category);
  });

  it('should restore the current catalog asset when the persisted id is still available', () => {
    storage.set(
      storageKey,
      JSON.stringify({ version: 1, assetId: staticAppleAsset.id, displayName: 'Old Apple' }),
    );

    const service = configureService();

    expect(service.selectedAsset()).toEqual(staticAppleAsset);
    expect(service.selectedCategory()).toBe('stock');
  });

  it('should persist catalog assets by id only', () => {
    const service = configureService();

    service.selectAsset(staticAppleAsset);

    expect(JSON.parse(storage.get(storageKey) ?? '{}')).toEqual({
      version: 1,
      assetId: staticAppleAsset.id,
    });
  });

  it('should not crash when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('storage unavailable');
      }),
      setItem: vi.fn(() => {
        throw new Error('storage unavailable');
      }),
    });

    const service = configureService();

    expect(service.selectedAsset()).toEqual(TRADEABLE_ASSETS[0]);
    expect(() => service.selectAsset(staticAppleAsset)).not.toThrow();
    expect(service.selectedAsset()).toEqual(staticAppleAsset);
  });
});
