import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store/appStore';
import { generateOHLC } from '../data/mockData';
import { formatNumber } from '../utils/finance';

function StatCard({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className={`text-xs mt-1 ${up === undefined ? 'text-slate-400' : up ? 'text-green-400' : 'text-red-400'}`}>{sub}</p>}
    </div>
  );
}

function IndexCard({ symbol, price, change, changePct }: { symbol: string; price: number; change: number; changePct: number }) {
  const up = changePct >= 0;
  const sparkData = generateOHLC(30, price).map(d => ({ v: d.close }));
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-semibold text-white">{symbol}</p>
          <p className="text-lg font-bold font-mono text-white">{price.toLocaleString()}</p>
        </div>
        <div className={`text-right text-sm ${up ? 'text-green-400' : 'text-red-400'}`}>
          <p>{up ? '+' : ''}{change.toFixed(2)}</p>
          <p>{up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={sparkData}>
          <defs>
            <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={up ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={up ? '#22c55e' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={up ? '#22c55e' : '#ef4444'} fill={`url(#grad-${symbol})`} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopMovers() {
  const { stocks } = useAppStore();
  const gainers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers  = [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-400 mb-3">🚀 Top Gainers</h3>
        {gainers.map(s => (
          <div key={s.symbol} className="flex justify-between py-1.5 border-b border-surface-600 last:border-0">
            <span className="text-sm text-white font-medium">{s.symbol}</span>
            <span className="text-sm font-mono text-green-400">+{s.changePct.toFixed(2)}%</span>
          </div>
        ))}
      </div>
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-400 mb-3">📉 Top Losers</h3>
        {losers.map(s => (
          <div key={s.symbol} className="flex justify-between py-1.5 border-b border-surface-600 last:border-0">
            <span className="text-sm text-white font-medium">{s.symbol}</span>
            <span className="text-sm font-mono text-red-400">{s.changePct.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FearGreedMeter({ value = 62 }: { value?: number }) {
  const angle = (value / 100) * 180 - 90;
  const label = value > 75 ? 'Extreme Greed' : value > 55 ? 'Greed' : value > 45 ? 'Neutral' : value > 25 ? 'Fear' : 'Extreme Fear';
  const color = value > 55 ? '#22c55e' : value > 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-4 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-slate-400 mb-3">Fear & Greed Index</h3>
      <svg viewBox="0 0 200 120" className="w-40">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1a2235" strokeWidth="20" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e" strokeWidth="20" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 251} 251`} />
        <g transform={`rotate(${angle}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="6" fill="#e2e8f0" />
        <text x="100" y="118" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">{label}</text>
        <text x="100" y="85" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{value}</text>
      </svg>
    </div>
  );
}

function MarketBreadth() {
  const advance = 1248, decline = 678, unchanged = 120;
  const total = advance + decline + unchanged;
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-3">Market Breadth</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm"><span className="text-green-400">Advances</span><span className="font-mono text-white">{advance}</span></div>
        <div className="w-full bg-surface-700 rounded-full h-2">
          <div className="h-2 bg-green-400 rounded-full" style={{ width: `${(advance/total)*100}%` }} />
        </div>
        <div className="flex justify-between text-sm"><span className="text-red-400">Declines</span><span className="font-mono text-white">{decline}</span></div>
        <div className="w-full bg-surface-700 rounded-full h-2">
          <div className="h-2 bg-red-400 rounded-full" style={{ width: `${(decline/total)*100}%` }} />
        </div>
        <div className="flex justify-between text-sm"><span className="text-slate-400">Unchanged</span><span className="font-mono text-white">{unchanged}</span></div>
        <p className="text-xs text-slate-500 mt-1">A/D Ratio: <span className="text-green-400">{(advance/decline).toFixed(2)}</span></p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { indices, stocks } = useAppStore();
  const totalMktCap = stocks.reduce((s, st) => s + st.marketCap, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Market Dashboard</h1>
        <span className="text-xs text-slate-400">Last updated: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Market Cap" value={`₹${formatNumber(totalMktCap)} Cr`} sub="NSE Listed" />
        <StatCard label="NIFTY 50" value="22,456" sub="▲ 0.60% today" up={true} />
        <StatCard label="FII Net" value="+₹2,341 Cr" sub="Net Buyers (5 days)" up={true} />
        <StatCard label="India VIX" value="13.42" sub="▼ 0.8 pts" up={false} />
      </div>

      {/* Indices */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Indices</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {indices.map(idx => (
            <IndexCard key={idx.symbol} {...idx} />
          ))}
        </div>
      </div>

      {/* Movers + Fear & Greed + Breadth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Market Sentiment</h2>
          <div className="space-y-4">
            <FearGreedMeter value={62} />
            <MarketBreadth />
          </div>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Movers</h2>
          <TopMovers />
        </div>
      </div>

      {/* Sector heatmap */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sector Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { name: 'IT', val: -0.6 }, { name: 'Finance', val: 1.1 }, { name: 'Energy', val: 1.4 },
            { name: 'FMCG', val: 0.3 }, { name: 'Auto', val: 2.1 }, { name: 'Pharma', val: -0.4 },
            { name: 'Metal', val: 0.8 }, { name: 'Realty', val: 1.8 }, { name: 'Media', val: -1.2 },
            { name: 'Telecom', val: 0.5 }, { name: 'Infra', val: 0.9 }, { name: 'PSU Bank', val: 1.5 },
            { name: 'MidCap', val: 0.7 }, { name: 'SmallCap', val: 1.2 },
          ].map(s => (
            <div key={s.name} className={`rounded p-2 text-center text-xs font-medium ${s.val > 1 ? 'bg-green-600 text-white' : s.val > 0 ? 'bg-green-800 text-green-200' : s.val > -1 ? 'bg-red-800 text-red-200' : 'bg-red-600 text-white'}`}>
              <div>{s.name}</div>
              <div>{s.val > 0 ? '+' : ''}{s.val.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
