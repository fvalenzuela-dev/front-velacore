import { routes } from './app.routes';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { TradingPage } from './pages/trading/trading.page';

describe('routes', () => {
  it('routes the default path to dashboard', () => {
    expect(routes).toContainEqual({ path: '', pathMatch: 'full', redirectTo: 'dashboard' });
  });

  it('configures dashboard and trading pages', () => {
    expect(routes).toContainEqual({ path: 'dashboard', component: DashboardPage });
    expect(routes).toContainEqual({ path: 'trading', component: TradingPage });
  });
});
