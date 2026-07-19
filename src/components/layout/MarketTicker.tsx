import { useAppStore } from '../../store/appStore';

export function MarketTicker() {
  const { indices, stocks } = useAppStore();

  const items = [
    ...indices.map(i => ({ symbol: i.symbol, price: i.price, changePct: i.changePct })),
    ...stocks.slice(0, 6).map(s => ({ symbol: s.symbol, price: s.price, changePct: s.changePct })),
  ];

  const doubled = [...items, ...items]; // duplicate for seamless loop

  return (
    <div className="fixed top-14 left-0 right-0 h-8 bg-surface-900 border-b border-surface-600 overflow-hidden flex items-center z-20">
      <div className="ticker-tape flex items-center">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-1 text-xs mr-8 shrink-0">
            <span className="text-slate-300 font-medium">{item.symbol}</span>
            <span className="font-mono text-white">{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            <span className={item.changePct >= 0 ? 'text-green-400' : 'text-red-400'}>
              {item.changePct >= 0 ? '▲' : '▼'} {Math.abs(item.changePct).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
