import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-primary/20 hover:bg-primary/90 focus-visible:outline-primary',
  secondary: 'bg-accent text-white shadow-accent/20 hover:bg-accent/90 focus-visible:outline-accent',
  success: 'bg-success text-white shadow-success/20 hover:bg-success/90 focus-visible:outline-success',
  danger: 'bg-danger text-white shadow-danger/20 hover:bg-danger/90 focus-visible:outline-danger',
  warning: 'bg-warning text-foreground shadow-warning/20 hover:bg-warning/90 focus-visible:outline-warning',
  info: 'bg-info text-white shadow-info/20 hover:bg-info/90 focus-visible:outline-info',
  neutral: 'bg-surface-elevated text-foreground ring-1 ring-border hover:bg-muted/10 focus-visible:outline-muted',
};

@Component({
  selector: 'app-button',
  imports: [NgClass],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled"
      class="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition enabled:cursor-pointer enabled:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
      [ngClass]="variantClasses"
    >
      <ng-content />
    </button>
  `,
})
export class Button {
  @Input() variant: ButtonVariant = 'neutral';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;

  protected get variantClasses(): string {
    return VARIANT_CLASSES[this.variant];
  }
}
