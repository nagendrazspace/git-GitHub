import { create } from 'zustand';
import { stocks, indices, futures, newsItems, portfolio, generateOHLC, type Stock, type OHLCData, type PortfolioHolding } from '../data/mockData';

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Watchlist
  watchlist: WatchlistItem[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;

  // Selected stock
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  chartData: OHLCData[];

  // Portfolio
  holdings: PortfolioHolding[];

  // Market data (static mock)
  stocks: Stock[];
  indices: typeof indices;
  futures: typeof futures;
  newsItems: typeof newsItems;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  watchlist: [
    { symbol: 'NIFTY 50',  price: 22456.80, change: 134.55,  changePct:  0.60 },
    { symbol: 'RELIANCE',  price: 2845.60,  change: 32.10,   changePct:  1.14 },
    { symbol: 'TCS',       price: 3980.45,  change: -18.30,  changePct: -0.46 },
    { symbol: 'AAPL',      price: 213.45,   change:  2.30,   changePct:  1.09 },
    { symbol: 'NVDA',      price: 875.30,   change:  28.40,  changePct:  3.35 },
  ],
  addToWatchlist: (symbol) => {
    const stock = get().stocks.find(s => s.symbol === symbol);
    if (!stock) return;
    set(s => ({
      watchlist: [...s.watchlist.filter(w => w.symbol !== symbol),
        { symbol, price: stock.price, change: stock.change, changePct: stock.changePct }],
    }));
  },
  removeFromWatchlist: (symbol) =>
    set(s => ({ watchlist: s.watchlist.filter(w => w.symbol !== symbol) })),

  selectedSymbol: 'RELIANCE',
  setSelectedSymbol: (symbol) =>
    set({ selectedSymbol: symbol, chartData: generateOHLC(120, stocks.find(s => s.symbol === symbol)?.price ?? 500) }),
  chartData: generateOHLC(120, 2845.60),

  holdings: portfolio,
  stocks,
  indices,
  futures,
  newsItems,
}));
