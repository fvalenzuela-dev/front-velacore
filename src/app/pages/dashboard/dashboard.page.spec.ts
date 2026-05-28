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

    const hostElement = fixture.nativeElement as HTMLElement;

    expect(hostElement.textContent).toContain('Ingresos del mes');
    expect(hostElement.textContent).toContain('$ 82.450');
    expect(hostElement.textContent).toContain('Clientes activos');
    expect(hostElement.textContent).toContain('1.248');
    expect(hostElement.textContent).toContain('Pedidos abiertos');
    expect(hostElement.textContent).toContain('36');
    expect(hostElement.textContent).toContain('Satisfacción');
    expect(hostElement.textContent).toContain('97%');
  });

  it('should render the reusable button showcase and disabled example', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Primary',
      'Secondary',
      'Success',
      'Danger',
      'Warning',
      'Info',
      'Neutral',
      'Disabled',
    ]);
    expect(buttons.at(-1)?.disabled).toBe(true);
  });

  it('should render weekly performance bars and activity entries', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const hostElement = fixture.nativeElement as HTMLElement;

    expect(Array.from(hostElement.querySelectorAll('span')).some((span) => span.textContent?.trim() === 'D7')).toBe(true);
    expect(hostElement.textContent).toContain('Objetivo comercial');
    expect(hostElement.textContent).toContain('Nuevo contrato cerrado');
    expect(hostElement.textContent).toContain('Alerta de stock');
    expect(hostElement.textContent).toContain('Pago confirmado');
    expect(hostElement.textContent).toContain('Soporte resuelto');
  });
});
