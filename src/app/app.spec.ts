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

    const hostElement = fixture.nativeElement as HTMLElement;
    const shell = hostElement.querySelector('main');
    const header = hostElement.querySelector('header');
    const menu = hostElement.querySelector('nav[aria-label="Main navigation"]');
    const trigger = hostElement.querySelector('nav > button');
    const floatingPanel = hostElement.querySelector('#main-navigation-menu');
    const topBar = hostElement.querySelector('[aria-label="Top bar"]');
    const leftBar = hostElement.querySelector('[aria-label="Left tools bar"]');
    const rightBar = hostElement.querySelector('[aria-label="Right tools bar"]');
    const contentGrid = hostElement.querySelector('main > section');
    const linkLabels = Array.from(hostElement.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );
    const linkHrefs = Array.from(hostElement.querySelectorAll('nav a')).map((link) =>
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

    document.body.click();
    fixture.detectChanges();

    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(floatingPanel?.classList.contains('pointer-events-none')).toBe(true);
    expect(topBar).toBeTruthy();
    expect(leftBar).toBeTruthy();
    expect(rightBar).toBeTruthy();
    expect(contentGrid?.classList.contains('grid-cols-[4rem_1fr_4rem]')).toBe(true);
    expect(linkLabels).toEqual(['Dashboard', 'Trading']);
    expect(linkHrefs).toEqual(['/dashboard', '/trading']);
  });
});
