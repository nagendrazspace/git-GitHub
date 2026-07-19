import { useAppStore } from '../../store/appStore';

export function Header() {
  const { toggleSidebar } = useAppStore();

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-800 border-b border-surface-600 flex items-center px-4 gap-4 z-30">
      <button
        onClick={toggleSidebar}
        className="text-slate-400 hover:text-white p-1 rounded transition-colors"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <div className="flex items-center gap-2">
        <span className="text-brand-400 font-bold text-lg">📉</span>
        <span className="font-bold text-white text-lg">TradeAnalyst</span>
        <span className="text-xs text-slate-500 ml-1">Pro</span>
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span>Market Open</span>
      </div>

      <div className="text-xs font-mono text-slate-300 hidden sm:block">
        🕐 {now}
      </div>

      <div className="text-xs text-slate-400 hidden lg:flex items-center gap-1">
        <span>NSE/BSE</span>
        <span className="text-green-400">●</span>
      </div>

      <button className="bg-brand-600 hover:bg-brand-500 text-white text-xs px-3 py-1.5 rounded transition-colors">
        + Watchlist
      </button>
    </header>
  );
}
