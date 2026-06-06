export type TradeableAssetCategory = 'crypto' | 'stock' | 'index' | 'etf';

export type TradeableAssetProvider = 'binance' | 'twelve-data' | 'yahoo';

export type TradeableAssetType = 'crypto' | 'stock' | 'index' | 'etf';

export type TradeableAsset = {
  id: string;
  symbol: string;
  displayName: string;
  category: TradeableAssetCategory;
  provider?: TradeableAssetProvider;
  exchange?: string;
  assetType?: TradeableAssetType;
};

export type TradeableAssetCategoryOption = {
  id: TradeableAssetCategory;
  label: string;
  description: string;
};

export const TRADEABLE_ASSET_CATEGORIES: readonly TradeableAssetCategoryOption[] = [
  {
    id: 'crypto',
    label: 'Cryptocurrencies',
    description: 'Spot crypto pairs and digital assets.',
  },
  {
    id: 'stock',
    label: 'Stocks',
    description: 'Individual company shares from major exchanges.',
  },
  {
    id: 'index',
    label: 'Indexes',
    description: 'Broad market benchmarks and sector indexes.',
  },
  {
    id: 'etf',
    label: 'ETFs',
    description: 'Exchange-traded funds for basket exposure.',
  },
] as const;

export const TRADEABLE_ASSETS: readonly TradeableAsset[] = [
  {
    id: 'crypto-btcusdt',
    symbol: 'BTCUSDT',
    displayName: 'Bitcoin / Tether',
    category: 'crypto',
    provider: 'binance',
    exchange: 'Binance Spot',
    assetType: 'crypto',
  },
  {
    id: 'crypto-btcusd',
    symbol: 'BTC-USD',
    displayName: 'Bitcoin / US Dollar',
    category: 'crypto',
    provider: 'yahoo',
    exchange: 'Yahoo Finance',
    assetType: 'crypto',
  },
  {
    id: 'crypto-ethusdt',
    symbol: 'ETHUSDT',
    displayName: 'Ethereum / Tether',
    category: 'crypto',
    provider: 'binance',
    exchange: 'Binance Spot',
    assetType: 'crypto',
  },
  {
    id: 'stock-tsla',
    symbol: 'TSLA',
    displayName: 'Tesla',
    category: 'stock',
    provider: 'twelve-data',
    exchange: 'NASDAQ',
    assetType: 'stock',
  },
  {
    id: 'stock-aapl',
    symbol: 'AAPL',
    displayName: 'Apple',
    category: 'stock',
    provider: 'twelve-data',
    exchange: 'NASDAQ',
    assetType: 'stock',
  },
  {
    id: 'stock-msft',
    symbol: 'MSFT',
    displayName: 'Microsoft',
    category: 'stock',
    provider: 'twelve-data',
    exchange: 'NASDAQ',
    assetType: 'stock',
  },
  {
    id: 'index-sp500',
    symbol: 'SP500',
    displayName: 'S&P 500',
    category: 'index',
    provider: 'yahoo',
    exchange: 'US Indexes',
    assetType: 'index',
  },
  {
    id: 'index-ndx',
    symbol: 'NDX',
    displayName: 'Nasdaq 100',
    category: 'index',
    provider: 'yahoo',
    exchange: 'US Indexes',
    assetType: 'index',
  },
  {
    id: 'index-dji',
    symbol: 'DJI',
    displayName: 'Dow Jones Industrial Average',
    category: 'index',
    provider: 'yahoo',
    exchange: 'US Indexes',
    assetType: 'index',
  },
  {
    id: 'etf-spy',
    symbol: 'SPY',
    displayName: 'SPDR S&P 500 ETF Trust',
    category: 'etf',
    provider: 'twelve-data',
    exchange: 'NYSE',
    assetType: 'etf',
  },
  {
    id: 'etf-qqq',
    symbol: 'QQQ',
    displayName: 'Invesco QQQ Trust',
    category: 'etf',
    provider: 'twelve-data',
    exchange: 'NASDAQ',
    assetType: 'etf',
  },
  {
    id: 'etf-voo',
    symbol: 'VOO',
    displayName: 'Vanguard S&P 500 ETF',
    category: 'etf',
    provider: 'twelve-data',
    exchange: 'NYSE',
    assetType: 'etf',
  },
] as const;
