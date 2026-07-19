import { useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { blackScholes } from '../utils/finance';
import { stocks } from '../data/mockData';

type Strategy = 'long-call' | 'long-put' | 'bull-call' | 'bear-put' | 'straddle' | 'strangle' | 'iron-condor' | 'covered-call';

const STRATEGIES: { id: Strategy; label: string; desc: string }[] = [
  { id: 'long-call',    label: '📈 Long Call',       desc: 'Bullish. Buy a call option.' },
  { id: 'long-put',     label: '📉 Long Put',        desc: 'Bearish. Buy a put option.' },
  { id: 'bull-call',    label: '🐂 Bull Call Spread', desc: 'Buy lower strike call, sell higher strike call.' },
  { id: 'bear-put',     label: '🐻 Bear Put Spread',  desc: 'Buy higher strike put, sell lower strike put.' },
  { id: 'straddle',     label: '🔄 Straddle',        desc: 'Buy call and put at same strike. Profits from big moves.' },
  { id: 'strangle',     label: '↔️ Strangle',         desc: 'Buy OTM call and OTM put. Cheaper than straddle.' },
  { id: 'iron-condor',  label: '🦅 Iron Condor',      desc: 'Sell strangle + buy wider strangle. Range-bound play.' },
  { id: 'covered-call', label: '🛡️ Covered Call',    desc: 'Hold stock + sell a call. Income strategy.' },
];

function calcPayoff(strategy: Strategy, S: number, K: number, premium: number, spot: number): number {
  const K2 = K + 200;
  const p2 = premium * 0.6;
  switch(strategy) {
    case 'long-call':    return Math.max(0, spot - K) - premium;
    case 'long-put':     return Math.max(0, K - spot) - premium;
    case 'bull-call':    return Math.max(0, spot-K) - Math.max(0, spot-K2) - (premium - p2);
    case 'bear-put':     return Math.max(0, K2-spot) - Math.max(0, K-spot) - (premium - p2);
    case 'straddle':     return Math.max(0,spot-K) + Math.max(0,K-spot) - premium*2;
    case 'strangle':     return Math.max(0,spot-(K+100)) + Math.max(0,(K-100)-spot) - premium*1.5;
    case 'iron-condor': {
      const short_c = K+100, long_c = K+300, short_p = K-100, long_p = K-300;
      return (
        -Math.max(0,spot-short_c) + Math.max(0,spot-long_c) +
        -Math.max(0,short_p-spot) + Math.max(0,long_p-spot) +
        premium
      );
    }
    case 'covered-call': return (spot - S) - Math.max(0, spot - K) + premium;
    default: return 0;
  }
}

export default function StrategyBuilder() {
  const stock = stocks[0];
  const S = stock.price;
  const [strategy, setStrategy] = useState<Strategy>('bull-call');
  const [strike, setStrike] = useState(Math.round(S / 100) * 100);
  const [iv, setIv] = useState(0.25);
  const [daysToExpiry, setDaysToExpiry] = useState(30);

  const T = daysToExpiry / 365;
  const r = 0.065;
  const premium = blackScholes(S, strike, T, r, iv, 'call');
  const strat = STRATEGIES.find(s => s.id === strategy)!;

  const payoffData = useMemo(() => {
    const range = S * 0.2;
    const points = 60;
    return Array.from({ length: points }, (_, i) => {
      const spot = S - range + (2 * range * i) / (points - 1);
      const payoff = calcPayoff(strategy, S, strike, premium, spot);
      return { spot: parseFloat(spot.toFixed(1)), payoff: parseFloat(payoff.toFixed(2)) };
    });
  }, [strategy, S, strike, premium]);

  const breakevens = payoffData.filter((d, i) => i > 0 && ((payoffData[i-1].payoff < 0) !== (d.payoff < 0)));
  const maxProfit = Math.max(...payoffData.map(d => d.payoff));
  const maxLoss   = Math.min(...payoffData.map(d => d.payoff));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Options Strategy Builder</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Strategy selector */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Strategy</h3>
          {STRATEGIES.map(s => (
            <button
              key={s.id}
              onClick={() => setStrategy(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors border ${strategy === s.id ? 'bg-brand-600 border-brand-400 text-white' : 'bg-surface-800 border-surface-600 text-slate-300 hover:bg-surface-700'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {/* Description */}
          <div className="bg-brand-900/30 border border-brand-700 rounded-lg px-4 py-2">
            <p className="text-sm text-brand-200">{strat.desc}</p>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400">Strike Price</label>
              <input type="number" value={strike} step={50} min={S*0.7} max={S*1.3}
                onChange={e => setStrike(Number(e.target.value))}
                className="mt-1 w-full bg-surface-700 border border-surface-500 text-white rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">IV (e.g. 0.25 = 25%)</label>
              <input type="number" value={iv} step={0.01} min={0.05} max={1.5}
                onChange={e => setIv(Number(e.target.value))}
                className="mt-1 w-full bg-surface-700 border border-surface-500 text-white rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Days to Expiry</label>
              <input type="number" value={daysToExpiry} step={1} min={1} max={365}
                onChange={e => setDaysToExpiry(Number(e.target.value))}
                className="mt-1 w-full bg-surface-700 border border-surface-500 text-white rounded px-3 py-1.5 text-sm" />
            </div>
          </div>

          {/* P&L summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-surface-800 border border-surface-600 rounded p-3 text-center">
              <p className="text-xs text-slate-500">Premium Paid</p>
              <p className="text-lg font-bold text-yellow-400">₹{premium.toFixed(2)}</p>
            </div>
            <div className="bg-surface-800 border border-surface-600 rounded p-3 text-center">
              <p className="text-xs text-slate-500">Max Profit</p>
              <p className={`text-lg font-bold ${maxProfit > 1e6 ? 'text-green-400' : 'text-green-400'}`}>
                {maxProfit > 9999 ? 'Unlimited' : `₹${maxProfit.toFixed(0)}`}
              </p>
            </div>
            <div className="bg-surface-800 border border-surface-600 rounded p-3 text-center">
              <p className="text-xs text-slate-500">Max Loss</p>
              <p className="text-lg font-bold text-red-400">{maxLoss < -9999 ? 'Unlimited' : `₹${maxLoss.toFixed(0)}`}</p>
            </div>
            <div className="bg-surface-800 border border-surface-600 rounded p-3 text-center">
              <p className="text-xs text-slate-500">Breakeven(s)</p>
              <p className="text-sm font-bold text-white">{breakevens.map(b => `₹${b.spot.toFixed(0)}`).join(', ') || 'N/A'}</p>
            </div>
          </div>

          {/* Payoff diagram */}
          <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Payoff at Expiry</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={payoffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
                <XAxis dataKey="spot" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(1)}K`} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  contentStyle={{ background: '#131925', border: '1px solid #2d3a55', fontSize: 12 }}
                  formatter={(v: unknown) => [`₹${(v as number).toFixed(2)}`, 'P&L']}
                  labelFormatter={(l: unknown) => `Spot: ₹${l}`}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                <ReferenceLine x={S} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Spot', fill: '#f59e0b', fontSize: 10 }} />
                <defs>
                  <linearGradient id="payoffGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="payoff" stroke="#4ade80" fill="url(#payoffGrad)"
                  strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
