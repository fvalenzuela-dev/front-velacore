import { Component } from '@angular/core';
import { Button, type ButtonVariant } from '../../ui/button/button';

@Component({
  selector: 'app-dashboard-page',
  imports: [Button],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  protected readonly buttonShowcase: readonly { label: string; variant: ButtonVariant }[] = [
    { label: 'Primary', variant: 'primary' },
    { label: 'Secondary', variant: 'secondary' },
    { label: 'Success', variant: 'success' },
    { label: 'Danger', variant: 'danger' },
    { label: 'Warning', variant: 'warning' },
    { label: 'Info', variant: 'info' },
    { label: 'Neutral', variant: 'neutral' },
  ];
}
