import { ChangeDetectorRef, Component, type ElementRef, ViewChild, inject } from '@angular/core';
import type { TradeableAsset, TradeableAssetCategory } from './trading-asset-catalog';
import { TradingAssetSelectionService } from './trading-asset-selection.service';

@Component({
  selector: 'app-trading-asset-selector',
  templateUrl: './trading-asset-selector.component.html',
})
export class TradingAssetSelectorComponent {
  @ViewChild('assetSelectorTrigger')
  private readonly assetSelectorTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('assetSelectorDialog')
  private readonly assetSelectorDialog?: ElementRef<HTMLDivElement>;
  @ViewChild('assetSelectorClose')
  private readonly assetSelectorClose?: ElementRef<HTMLButtonElement>;

  protected readonly assetSelection = inject(TradingAssetSelectionService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  protected openAssetSelector(): void {
    this.assetSelection.openAssetSelector();
    this.changeDetector.detectChanges();
    this.assetSelectorClose?.nativeElement.focus();
  }

  protected closeAssetSelector(restoreFocus = true): void {
    this.assetSelection.closeAssetSelector();
    this.changeDetector.detectChanges();

    if (restoreFocus) {
      this.assetSelectorTrigger?.nativeElement.focus();
    }
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
      this.assetSelectorDialog?.nativeElement.querySelectorAll<HTMLElement>('button, input') ?? [],
    ).filter((element) => !('disabled' in element) || !element.disabled);

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
    this.assetSelection.selectCategory(category);
  }

  protected searchStockAssets(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.assetSelection.searchStockAssets(input.value);
    }
  }

  protected selectAsset(asset: TradeableAsset): void {
    this.assetSelection.selectAsset(asset);
    this.closeAssetSelector(false);
    this.assetSelectorTrigger?.nativeElement.focus();
  }
}
