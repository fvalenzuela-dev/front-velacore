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

    const metricLabels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('section:first-of-type article p'),
    ).map((label) => label.textContent?.trim());
    const metricValues = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        'section:first-of-type article strong',
      ),
    ).map((value) => value.textContent?.trim());

    expect(metricLabels).toEqual([
      'Ingresos del mes',
      'Clientes activos',
      'Pedidos abiertos',
      'Satisfacción',
    ]);
    expect(metricValues).toEqual(['$ 82.450', '1.248', '36', '97%']);
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
    const sectionHeadings = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('h2'),
    ).map((heading) => heading.textContent?.trim());
    const activityTitles = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('aside h3'),
    ).map((title) => title.textContent?.trim());

    expect(spanTexts).toContain('D7');
    expect(sectionHeadings).toContain('Objetivo comercial');
    expect(activityTitles).toEqual([
      'Nuevo contrato cerrado',
      'Alerta de stock',
      'Pago confirmado',
      'Soporte resuelto',
    ]);
  });
});
