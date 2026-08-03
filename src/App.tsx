import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MarketTicker } from './components/layout/MarketTicker';
import { useAppStore } from './store/appStore';

import Dashboard from './pages/Dashboard';
import StockAnalysis from './pages/StockAnalysis';
import Screener from './pages/Screener';
import OptionsChain from './pages/OptionsChain';
import StrategyBuilder from './pages/StrategyBuilder';
import Futures from './pages/Futures';
import FOSignals from './pages/FOSignals';
import News from './pages/News';
import Portfolio from './pages/Portfolio';

// Re-export NavLink so Sidebar can use it if needed
export { NavLink };

function AppLayout() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-surface-900 dark">
      <Header />
      <MarketTicker />
      <Sidebar />
      <main className={`pt-[5.5rem] pb-8 transition-all duration-300 ${sidebarOpen ? 'pl-56' : 'pl-14'} pr-4 md:pr-6`}>
        <div className="max-w-screen-2xl mx-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/stocks"    element={<StockAnalysis />} />
            <Route path="/screener"  element={<Screener />} />
            <Route path="/options"   element={<OptionsChain />} />
            <Route path="/strategy"  element={<StrategyBuilder />} />
            <Route path="/futures"   element={<Futures />} />
            <Route path="/fo-signals" element={<FOSignals />} />
            <Route path="/news"      element={<News />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
