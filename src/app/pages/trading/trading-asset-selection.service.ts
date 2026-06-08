import { computed, Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import {
  TRADEABLE_ASSET_CATEGORIES,
  TRADEABLE_ASSETS,
  type TradeableAsset,
  type TradeableAssetCategory,
} from './trading-asset-catalog';
import { TradingMarketDataService } from './trading-market-data.service';

const SELECTED_ASSET_STORAGE_KEY = 'velacore-trading-selected-asset';
const SELECTED_ASSET_STORAGE_VERSION = 1;
const DEFAULT_SELECTED_ASSET = TRADEABLE_ASSETS[0];

interface PersistedSelectedAsset {
  version: typeof SELECTED_ASSET_STORAGE_VERSION;
  assetId?: string;
  dynamicStock?: PersistedDynamicStockAsset;
}

interface PersistedDynamicStockAsset {
  id: string;
  symbol: string;
  displayName: string;
  exchange: string;
}

@Injectable({ providedIn: 'root' })
export class TradingAssetSelectionService {
  private readonly marketData = inject(TradingMarketDataService);
  private readonly initialSelectedAsset = this.restoreSelectedAsset();
  private readonly selectedAssetState = signal<TradeableAsset>(this.initialSelectedAsset);
  private readonly selectedCategoryState = signal<TradeableAssetCategory>(
    this.initialSelectedAsset.category,
  );
  private readonly stockAssetsState = signal<readonly TradeableAsset[]>(
    TRADEABLE_ASSETS.filter((asset) => asset.category === 'stock'),
  );
  private readonly isAssetSelectorOpenState = signal(false);
  private readonly isStockAssetsLoadingState = signal(false);
  private readonly stockAssetsLoadErrorState = signal(false);
  private readonly stockSearchQueryState = signal('');
  private readonly selectedAssetChangesSubject = new Subject<TradeableAsset>();
  private latestStockAssetsRequestId = 0;

  readonly assetCategories = TRADEABLE_ASSET_CATEGORIES;
  readonly assets = TRADEABLE_ASSETS;
  readonly selectedAsset = this.selectedAssetState.asReadonly();
  readonly selectedCategory = this.selectedCategoryState.asReadonly();
  readonly stockAssets = this.stockAssetsState.asReadonly();
  readonly isAssetSelectorOpen = this.isAssetSelectorOpenState.asReadonly();
  readonly isStockAssetsLoading = this.isStockAssetsLoadingState.asReadonly();
  readonly stockAssetsLoadError = this.stockAssetsLoadErrorState.asReadonly();
  readonly stockSearchQuery = this.stockSearchQueryState.asReadonly();
  readonly selectedAssetChanges = this.selectedAssetChangesSubject.asObservable();
  readonly selectedAssetText = computed(() =>
    this.normalizeAssetSymbol(this.selectedAssetState().symbol),
  );
  readonly selectedCategoryAssets = computed(() => {
    const selectedCategory = this.selectedCategoryState();

    if (selectedCategory === 'stock') {
      return this.stockAssetsState();
    }

    return this.assets.filter((asset) => asset.category === selectedCategory);
  });

  openAssetSelector(): void {
    const selectedAsset = this.selectedAssetState();
    this.selectedCategoryState.set(selectedAsset.category);
    this.isAssetSelectorOpenState.set(true);

    if (selectedAsset.category === 'stock') {
      void this.loadStockAssets();
    }
  }

  closeAssetSelector(): void {
    this.isAssetSelectorOpenState.set(false);
  }

  selectCategory(category: TradeableAssetCategory): void {
    this.selectedCategoryState.set(category);

    if (category === 'stock') {
      this.stockSearchQueryState.set('');
      void this.loadStockAssets();
    }
  }

  searchStockAssets(query: string): void {
    this.stockSearchQueryState.set(query);
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      void this.loadStockAssets();
      return;
    }

    void this.loadStockSearchResults(trimmedQuery);
  }

  selectAsset(asset: TradeableAsset): void {
    this.selectedAssetState.set(asset);
    this.persistSelectedAsset(asset);
    this.closeAssetSelector();
    this.selectedAssetChangesSubject.next(asset);
  }

  private async loadStockAssets(): Promise<void> {
    await this.loadStockAssetsFromBackend(() => this.marketData.loadNasdaqCommonStocks());
  }

  private async loadStockSearchResults(query: string): Promise<void> {
    await this.loadStockAssetsFromBackend(() => this.marketData.searchTwelveDataSymbols(query));
  }

  private async loadStockAssetsFromBackend(
    loader: () => Promise<readonly TradeableAsset[]>,
  ): Promise<void> {
    const requestId = ++this.latestStockAssetsRequestId;
    this.isStockAssetsLoadingState.set(true);
    this.stockAssetsLoadErrorState.set(false);

    const stockAssets = await loader();

    if (requestId !== this.latestStockAssetsRequestId) {
      return;
    }

    this.isStockAssetsLoadingState.set(false);
    this.stockAssetsLoadErrorState.set(stockAssets.length === 0);

    if (stockAssets.length > 0) {
      this.stockAssetsState.set(stockAssets);
    }
  }

  private restoreSelectedAsset(): TradeableAsset {
    try {
      const storedAsset = globalThis.localStorage?.getItem(SELECTED_ASSET_STORAGE_KEY);

      if (!storedAsset) {
        return DEFAULT_SELECTED_ASSET;
      }

      return this.toValidPersistedAsset(JSON.parse(storedAsset)) ?? DEFAULT_SELECTED_ASSET;
    } catch {
      return DEFAULT_SELECTED_ASSET;
    }
  }

  private persistSelectedAsset(asset: TradeableAsset): void {
    const persistedAsset = this.toPersistedSelectedAsset(asset);

    if (!persistedAsset) {
      return;
    }

    try {
      globalThis.localStorage?.setItem(SELECTED_ASSET_STORAGE_KEY, JSON.stringify(persistedAsset));
    } catch {
      // Selection must keep working when browser storage is unavailable.
    }
  }

  private toPersistedSelectedAsset(asset: TradeableAsset): PersistedSelectedAsset | undefined {
    if (TRADEABLE_ASSETS.some((catalogAsset) => catalogAsset.id === asset.id)) {
      return { version: SELECTED_ASSET_STORAGE_VERSION, assetId: asset.id };
    }

    const dynamicStock = this.toPersistedDynamicStockAsset(asset);

    return dynamicStock ? { version: SELECTED_ASSET_STORAGE_VERSION, dynamicStock } : undefined;
  }

  private toValidPersistedAsset(value: unknown): TradeableAsset | undefined {
    if (!this.isRecord(value) || value['version'] !== SELECTED_ASSET_STORAGE_VERSION) {
      return undefined;
    }

    const assetId = value['assetId'];

    if (this.isNonEmptyString(assetId)) {
      return TRADEABLE_ASSETS.find((asset) => asset.id === assetId);
    }

    return this.toDynamicStockAsset(value['dynamicStock']);
  }

  private toPersistedDynamicStockAsset(
    asset: TradeableAsset,
  ): PersistedDynamicStockAsset | undefined {
    if (
      asset.category !== 'stock' ||
      asset.provider !== 'twelve-data' ||
      asset.assetType !== 'stock' ||
      !this.isNonEmptyString(asset.exchange)
    ) {
      return undefined;
    }

    return {
      id: asset.id.trim(),
      symbol: asset.symbol.trim().toUpperCase(),
      displayName: asset.displayName.trim(),
      exchange: asset.exchange.trim(),
    };
  }

  private toDynamicStockAsset(value: unknown): TradeableAsset | undefined {
    if (!this.isRecord(value)) {
      return undefined;
    }

    const id = value['id'];
    const symbol = value['symbol'];
    const displayName = value['displayName'];
    const exchange = value['exchange'];

    if (
      !this.isNonEmptyString(id) ||
      !this.isNonEmptyString(symbol) ||
      !this.isNonEmptyString(displayName) ||
      !this.isNonEmptyString(exchange)
    ) {
      return undefined;
    }

    return {
      id: id.trim(),
      symbol: symbol.trim().toUpperCase(),
      displayName: displayName.trim(),
      category: 'stock',
      provider: 'twelve-data',
      exchange: exchange.trim(),
      assetType: 'stock',
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private normalizeAssetSymbol(symbol: string): string {
    return symbol.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }
}
