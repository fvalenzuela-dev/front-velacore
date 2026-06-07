import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';
import { TradingAssetSelectorComponent } from './pages/trading/trading-asset-selector.component';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TradingAssetSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly themeService = inject(ThemeService);
  protected readonly isDarkTheme = this.themeService.isDark;
  protected readonly title = 'Velacore';
  protected isMenuOpen = false;

  protected toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  protected closeMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.isMenuOpen) {
      return;
    }

    const target = event.target;

    if (target instanceof Element && target.closest('[data-navigation-menu]')) {
      return;
    }

    this.isMenuOpen = false;
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
