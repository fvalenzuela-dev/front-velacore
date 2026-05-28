import { TestBed } from '@angular/core/testing';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
    }).compileComponents();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(DashboardPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose the reusable button showcase variants', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    const component = fixture.componentInstance as unknown as {
      buttonShowcase: readonly { label: string; variant: string }[];
    };

    expect(component.buttonShowcase).toEqual([
      { label: 'Primary', variant: 'primary' },
      { label: 'Secondary', variant: 'secondary' },
      { label: 'Success', variant: 'success' },
      { label: 'Danger', variant: 'danger' },
      { label: 'Warning', variant: 'warning' },
      { label: 'Info', variant: 'info' },
      { label: 'Neutral', variant: 'neutral' },
    ]);
  });

  it('should render the key dashboard metrics', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const dashboardText = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(dashboardText).toContain('Ingresos del mes');
    expect(dashboardText).toContain('$ 82.450');
    expect(dashboardText).toContain('Clientes activos');
    expect(dashboardText).toContain('1.248');
    expect(dashboardText).toContain('Pedidos abiertos');
    expect(dashboardText).toContain('36');
    expect(dashboardText).toContain('Satisfacción');
    expect(dashboardText).toContain('97%');
  });

  it('should render the reusable button showcase and disabled example', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const buttonLabels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).map((button) => button.textContent?.trim());
    const isLastButtonDisabled = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).at(-1)?.disabled;

    expect(buttonLabels).toEqual([
      'Primary',
      'Secondary',
      'Success',
      'Danger',
      'Warning',
      'Info',
      'Neutral',
      'Disabled',
    ]);
    expect(isLastButtonDisabled).toBe(true);
  });

  it('should render weekly performance bars and activity entries', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const spanTexts = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('span'),
    ).map((span) => span.textContent?.trim());
    const dashboardText = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(spanTexts).toContain('D7');
    expect(dashboardText).toContain('Objetivo comercial');
    expect(dashboardText).toContain('Nuevo contrato cerrado');
    expect(dashboardText).toContain('Alerta de stock');
    expect(dashboardText).toContain('Pago confirmado');
    expect(dashboardText).toContain('Soporte resuelto');
  });
});
