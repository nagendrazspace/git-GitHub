import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

const navItems = [
  { path: '/',           icon: '📊', label: 'Dashboard' },
  { path: '/stocks',     icon: '📈', label: 'Stock Analysis' },
  { path: '/screener',   icon: '🔍', label: 'Screener' },
  { path: '/options',    icon: '⚡', label: 'Options Chain' },
  { path: '/strategy',   icon: '🎯', label: 'Strategy Builder' },
  { path: '/futures',    icon: '🔮', label: 'Futures' },
  { path: '/news',       icon: '📰', label: 'News & Sentiment' },
  { path: '/portfolio',  icon: '💼', label: 'Portfolio' },
];

export function Sidebar() {
  const { sidebarOpen, watchlist } = useAppStore();

  return (
    <aside className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-surface-800 border-r border-surface-600 transition-all duration-300 z-20 flex flex-col ${sidebarOpen ? 'w-56' : 'w-14'}`}>
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 transition-colors text-sm ${
                isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-surface-700'
              }`
            }
          >
            <span className="text-lg shrink-0">{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="border-t border-surface-600 p-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Watchlist</p>
          {watchlist.map(w => (
            <div key={w.symbol} className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-300">{w.symbol}</span>
              <span className={`text-xs font-mono ${w.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {w.changePct >= 0 ? '▲' : '▼'} {Math.abs(w.changePct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
