import { computed, Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import {
  TRADEABLE_ASSET_CATEGORIES,
  TRADEABLE_ASSETS,
  type TradeableAsset,
  type TradeableAssetCategory,
} from './trading-asset-catalog';
import { TradingMarketDataService } from './trading-market-data.service';

@Injectable({ providedIn: 'root' })
export class TradingAssetSelectionService {
  private readonly marketData = inject(TradingMarketDataService);
  private readonly selectedAssetState = signal<TradeableAsset>(TRADEABLE_ASSETS[0]);
  private readonly selectedCategoryState = signal<TradeableAssetCategory>(TRADEABLE_ASSETS[0].category);
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
  readonly selectedAssetText = computed(() => this.normalizeAssetSymbol(this.selectedAssetState().symbol));
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

  private normalizeAssetSymbol(symbol: string): string {
    return symbol.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }
}
