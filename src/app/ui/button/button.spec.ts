import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `<app-button variant="danger" [disabled]="isDisabled">Delete</app-button>`,
})
class ButtonHost {
  isDisabled = false;
}

describe('Button', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonHost],
    }).compileComponents();
  });

  it('should render projected content', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.textContent).toContain('Delete');
  });

  it('should apply the selected variant classes', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.className).toContain('bg-danger');
  });

  it('should support the disabled state', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.isDisabled = true;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.disabled).toBe(true);
  });
});
