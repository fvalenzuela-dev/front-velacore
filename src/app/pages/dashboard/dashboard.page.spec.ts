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

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ingresos del mes');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('$ 82.450');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Clientes activos');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1.248');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pedidos abiertos');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('36');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Satisfacción');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('97%');
  });

  it('should render the reusable button showcase and disabled example', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual([
      'Primary',
      'Secondary',
      'Success',
      'Danger',
      'Warning',
      'Info',
      'Neutral',
      'Disabled',
    ]);
    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).at(-1)?.disabled,
    ).toBe(true);
  });

  it('should render weekly performance bars and activity entries', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('span')).some(
        (span) => span.textContent?.trim() === 'D7',
      ),
    ).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Objetivo comercial');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nuevo contrato cerrado');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Alerta de stock');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pago confirmado');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Soporte resuelto');
  });
});
