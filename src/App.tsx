import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import News from './pages/News';
import Portfolio from './pages/Portfolio';

function AppLayout() {
  const { sidebarOpen } = useAppStore();
  const location = useLocation();

  // highlight active link
  const links = document.querySelectorAll('aside a');
  links.forEach(a => {
    const href = a.getAttribute('href') ?? '';
    const isActive = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
    if (isActive) {
      a.classList.add('bg-brand-700', 'text-white');
      a.classList.remove('text-slate-400');
    } else {
      a.classList.remove('bg-brand-700', 'text-white');
      a.classList.add('text-slate-400');
    }
  });

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
