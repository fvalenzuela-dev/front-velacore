import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render top, left, and right shell bars with the VC menu in the top-left', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const shell = nativeElement.querySelector('main');
    const header = nativeElement.querySelector('header');
    const menu = nativeElement.querySelector('nav[aria-label="Main navigation"]');
    const trigger = nativeElement.querySelector('nav > button');
    const floatingPanel = nativeElement.querySelector('#main-navigation-menu');
    const topBar = nativeElement.querySelector('[aria-label="Top bar"]');
    const leftBar = nativeElement.querySelector('[aria-label="Left tools bar"]');
    const rightBar = nativeElement.querySelector('[aria-label="Right tools bar"]');
    const contentGrid = nativeElement.querySelector('main > section');
    const linkLabels = Array.from(nativeElement.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );
    const linkHrefs = Array.from(nativeElement.querySelectorAll('nav a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(shell?.classList.contains('grid-rows-[4rem_1fr]')).toBe(true);
    expect(header).toBeTruthy();
    expect(menu?.classList.contains('w-16')).toBe(true);
    expect(trigger?.textContent?.trim()).toBe('VC');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(floatingPanel?.classList.contains('absolute')).toBe(true);
    expect(floatingPanel?.classList.contains('pointer-events-none')).toBe(true);

    (trigger as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(floatingPanel?.classList.contains('opacity-100')).toBe(true);
    expect(floatingPanel?.classList.contains('pointer-events-auto')).toBe(true);
    expect(topBar).toBeTruthy();
    expect(leftBar).toBeTruthy();
    expect(rightBar).toBeTruthy();
    expect(contentGrid?.classList.contains('grid-cols-[4rem_1fr_4rem]')).toBe(true);
    expect(linkLabels).toEqual(['Dashboard', 'Trading']);
    expect(linkHrefs).toEqual(['/dashboard', '/trading']);
  });
});
