import {
  type AfterViewInit,
  ChangeDetectorRef,
  Component,
  type ElementRef,
  type OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import {
  TRADEABLE_ASSET_CATEGORIES,
  TRADEABLE_ASSETS,
  type TradeableAsset,
  type TradeableAssetCategory,
} from './trading-asset-catalog';
import { TradingMarketDataService, type TradingChartData } from './trading-market-data.service';

@Component({
  selector: 'app-trading-page',
  templateUrl: './trading.page.html',
})
export class TradingPage implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: true })
  private readonly chartContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('assetSelectorTrigger')
  private readonly assetSelectorTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('assetSelectorDialog')
  private readonly assetSelectorDialog?: ElementRef<HTMLDivElement>;
  @ViewChild('assetSelectorClose')
  private readonly assetSelectorClose?: ElementRef<HTMLButtonElement>;

  private readonly marketData = inject(TradingMarketDataService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private chart?: IChartApi;
  private candleSeries?: ISeriesApi<'Candlestick'>;
  private volumeSeries?: ISeriesApi<'Histogram'>;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  protected readonly assetCategories = TRADEABLE_ASSET_CATEGORIES;
  protected readonly assets = TRADEABLE_ASSETS;
  protected loadError = false;
  protected isAssetSelectorOpen = false;
  protected selectedAsset: TradeableAsset = TRADEABLE_ASSETS[0];
  protected selectedCategory: TradeableAssetCategory = this.selectedAsset.category;

  protected get selectedCategoryAssets(): readonly TradeableAsset[] {
    return this.assets.filter((asset) => asset.category === this.selectedCategory);
  }

  protected openAssetSelector(): void {
    this.selectedCategory = this.selectedAsset.category;
    this.isAssetSelectorOpen = true;
    this.changeDetector.detectChanges();
    this.assetSelectorClose?.nativeElement.focus();
  }

  protected closeAssetSelector(): void {
    this.isAssetSelectorOpen = false;
    this.changeDetector.detectChanges();
    this.assetSelectorTrigger?.nativeElement.focus();
  }

  protected trapAssetSelectorFocus(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAssetSelector();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = Array.from(
      this.assetSelectorDialog?.nativeElement.querySelectorAll<HTMLButtonElement>('button') ?? [],
    ).filter((element) => !element.disabled);

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  protected selectCategory(category: TradeableAssetCategory): void {
    this.selectedCategory = category;
  }

  protected selectAsset(asset: TradeableAsset): void {
    this.selectedAsset = asset;
    this.closeAssetSelector();
  }

  async ngAfterViewInit(): Promise<void> {
    const container = this.chartContainer?.nativeElement;

    if (!container) {
      return;
    }

    this.createTradingChart(container);
    this.attachResizeObserver(container);

    const data = await this.marketData.loadBitcoinChartData();

    if (this.destroyed) {
      return;
    }

    this.applyChartData(data);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.chart?.remove();
  }

  private createTradingChart(container: HTMLDivElement): void {
    this.chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.12)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.12)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
        timeVisible: true,
      },
      crosshair: {
        mode: 1,
      },
    });

    this.candleSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    this.volumeSeries = this.chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    this.chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
  }

  private attachResizeObserver(container: HTMLDivElement): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!this.chart) {
        return;
      }

      const { width, height } = entry.contentRect;
      this.chart.resize(Math.floor(width), Math.floor(height));
    });
    this.resizeObserver.observe(container);
  }

  private applyChartData(data: TradingChartData): void {
    if (this.destroyed) {
      return;
    }

    this.loadError = data.source === 'fallback';

    this.candleSeries?.setData(data.candles);
    this.volumeSeries?.setData(data.volumes);
    this.chart?.timeScale().fitContent();
    this.changeDetector.detectChanges();
  }
}
