import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';
import { Button, type ButtonVariant } from './ui/button/button';

@Component({
  selector: 'app-root',
  imports: [Button],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly themeService = inject(ThemeService);
  protected readonly isDarkTheme = this.themeService.isDark;
  protected readonly title = 'Velacore';
  protected readonly buttonShowcase: readonly { label: string; variant: ButtonVariant }[] = [
    { label: 'Primary', variant: 'primary' },
    { label: 'Secondary', variant: 'secondary' },
    { label: 'Success', variant: 'success' },
    { label: 'Danger', variant: 'danger' },
    { label: 'Warning', variant: 'warning' },
    { label: 'Info', variant: 'info' },
    { label: 'Neutral', variant: 'neutral' },
  ];

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
