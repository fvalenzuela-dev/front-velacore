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
import { TradingMarketDataService, type TradingChartData } from './trading-market-data.service';

@Component({
  selector: 'app-trading-page',
  templateUrl: './trading.page.html',
})
export class TradingPage implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: true })
  private readonly chartContainer?: ElementRef<HTMLDivElement>;

  private readonly marketData = inject(TradingMarketDataService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private chart?: IChartApi;
  private candleSeries?: ISeriesApi<'Candlestick'>;
  private volumeSeries?: ISeriesApi<'Histogram'>;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  protected loadError = false;

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
