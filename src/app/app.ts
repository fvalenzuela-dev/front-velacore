import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
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

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
