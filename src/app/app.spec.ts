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

  it('should render the sidebar navigation links', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a'));
    expect(links.map((link) => link.textContent?.trim())).toEqual(['Dashboard', 'Trading']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/dashboard', '/trading']);
  });
});
