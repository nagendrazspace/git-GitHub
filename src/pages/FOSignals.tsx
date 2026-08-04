import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { blackScholes } from '../utils/finance';
import {
  computeCompositeSignal,
  computeRSI,
  getSignalBg,
  getSignalLabel,
  type CompositeSignal,
  type IndicatorSignal,
  type SignalType,
} from '../utils/signals';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OIStrike {
  strike: number;
  callOI: number;
  putOI: number;
}

interface TradeRec {
  action: 'BUY' | 'SELL';
  optionType: 'CE' | 'PE';
  strike: number;
  expiryLabel: string;
  entry: number;
  target: number;
  stopLoss: number;
  rationale: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initHistory(base: number, count = 30): number[] {
  const prices: number[] = [base];
  for (let i = 1; i < count; i++) {
    const prev = prices[i - 1];
    prices.push(parseFloat((prev + (Math.random() - 0.5) * prev * 0.0018).toFixed(2)));
  }
  return prices.reverse();
}

function nextWeekday(dow: number): Date {
  const d = new Date();
  const diff = ((dow - d.getDay()) + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(15, 30, 0, 0);
  return d;
}

function getExpiryDates() {
  const niftyWeekly  = nextWeekday(4); // Thursday
  const bnWeekly     = nextWeekday(3); // Wednesday
  const now = new Date();
  // Last Thursday of current month, fallback to next month
  let monthly = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  while (monthly.getDay() !== 4) monthly.setDate(monthly.getDate() - 1);
  monthly.setHours(15, 30, 0, 0);
  if (monthly <= niftyWeekly) {
    monthly = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    while (monthly.getDay() !== 4) monthly.setDate(monthly.getDate() - 1);
    monthly.setHours(15, 30, 0, 0);
  }
  return { niftyWeekly, bnWeekly, monthly };
}

function formatExpiry(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatCountdown(target: Date): { label: string; urgent: boolean } {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { label: 'EXPIRED', urgent: true };
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return {
    label: d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`,
    urgent: d === 0,
  };
}

function generateOIData(atm: number, step: number, count = 11): OIStrike[] {
  const half = Math.floor(count / 2);
  return Array.from({ length: count }, (_, idx) => {
    const i = idx - half;
    const strike = atm + i * step;
    // Calls: peak just above ATM (resistance); puts: peak just below ATM (support)
    const callOI = Math.max(8_000, Math.round(220_000 * Math.exp(-0.28 * (i - 2) ** 2) + 22_000));
    const putOI  = Math.max(8_000, Math.round(200_000 * Math.exp(-0.28 * (i + 2) ** 2) + 22_000));
    return { strike, callOI, putOI };
  });
}

function makeTrades(
  signal: CompositeSignal,
  spot: number,
  atm: number,
  step: number,
  expiryLabel: string,
  iv: number,
  T: number,
): TradeRec[] {
  const r = 0.065;
  const bs = (K: number, type: 'call' | 'put') => Math.max(1, Math.round(blackScholes(spot, K, T, r, iv, type)));

  if (signal.signal === 'STRONG_BUY' || signal.signal === 'BUY') {
    const mult = signal.signal === 'STRONG_BUY' ? 2.1 : 1.7;
    const atmCE = bs(atm, 'call');
    const otmCE = bs(atm + step * 2, 'call');
    const otmPE = bs(atm - step * 2, 'put');
    return [
      {
        action: 'BUY', optionType: 'CE', strike: atm, expiryLabel,
        entry: atmCE,
        target: Math.round(atmCE * mult),
        stopLoss: Math.round(atmCE * 0.5),
        rationale: `ATM call — directional bullish play; target ~${step} pt move`,
      },
      {
        action: 'BUY', optionType: 'CE', strike: atm + step * 2, expiryLabel,
        entry: otmCE,
        target: Math.round(otmCE * (mult + 0.5)),
        stopLoss: Math.round(otmCE * 0.4),
        rationale: `OTM call — high-leverage aggressive play for ~${step * 3} pt move`,
      },
      {
        action: 'SELL', optionType: 'PE', strike: atm - step * 2, expiryLabel,
        entry: otmPE,
        target: 0,
        stopLoss: Math.round(otmPE * 2.5),
        rationale: `Short OTM put — collect premium; market unlikely to breach ${(atm - step * 2).toLocaleString()}`,
      },
    ];
  }

  if (signal.signal === 'STRONG_SELL' || signal.signal === 'SELL') {
    const mult = signal.signal === 'STRONG_SELL' ? 2.1 : 1.7;
    const atmPE = bs(atm, 'put');
    const otmPE = bs(atm - step * 2, 'put');
    const otmCE = bs(atm + step * 2, 'call');
    return [
      {
        action: 'BUY', optionType: 'PE', strike: atm, expiryLabel,
        entry: atmPE,
        target: Math.round(atmPE * mult),
        stopLoss: Math.round(atmPE * 0.5),
        rationale: `ATM put — directional bearish play; target ~${step} pt drop`,
      },
      {
        action: 'BUY', optionType: 'PE', strike: atm - step * 2, expiryLabel,
        entry: otmPE,
        target: Math.round(otmPE * (mult + 0.5)),
        stopLoss: Math.round(otmPE * 0.4),
        rationale: `OTM put — aggressive downside play for ~${step * 3} pt drop`,
      },
      {
        action: 'SELL', optionType: 'CE', strike: atm + step * 2, expiryLabel,
        entry: otmCE,
        target: 0,
        stopLoss: Math.round(otmCE * 2.5),
        rationale: `Short OTM call — collect premium; market unlikely to cross ${(atm + step * 2).toLocaleString()}`,
      },
    ];
  }

  // Neutral — short iron condor legs
  const scEntry = bs(atm + step, 'call');
  const spEntry = bs(atm - step, 'put');
  return [
    {
      action: 'SELL', optionType: 'CE', strike: atm + step, expiryLabel,
      entry: scEntry,
      target: 0,
      stopLoss: Math.round(scEntry * 2.5),
      rationale: `Iron Condor CE leg — market expected below ${(atm + step).toLocaleString()} at expiry`,
    },
    {
      action: 'SELL', optionType: 'PE', strike: atm - step, expiryLabel,
      entry: spEntry,
      target: 0,
      stopLoss: Math.round(spEntry * 2.5),
      rationale: `Iron Condor PE leg — market expected above ${(atm - step).toLocaleString()} at expiry`,
    },
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CountdownCard({ label, date, icon }: { label: string; date: Date; icon: string }) {
  const cd = formatCountdown(date);
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${cd.urgent ? 'bg-red-900/20 border-red-500/40' : 'bg-surface-800 border-surface-600'}`}>
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm font-bold font-mono ${cd.urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>{cd.label}</p>
        <p className="text-xs text-slate-500">{formatExpiry(date)}</p>
      </div>
    </div>
  );
}

function IndicatorRow({ ind }: { ind: IndicatorSignal }) {
  const bars = Math.round(Math.abs(ind.score));
  const isPos = ind.score >= 0;
  return (
    <tr className="border-b border-surface-700 hover:bg-surface-700/40 transition-colors">
      <td className="py-2 px-3 text-sm text-slate-300 font-medium whitespace-nowrap">{ind.indicator}</td>
      <td className="py-2 px-3 text-sm font-mono text-white text-right whitespace-nowrap">{ind.value}</td>
      <td className="py-2 px-3 text-right whitespace-nowrap">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getSignalBg(ind.signal)}`}>
          {ind.signal.replace('_', ' ')}
        </span>
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1 justify-end">
          {[0, 1].map(i => (
            <div
              key={i}
              className={`h-2.5 w-4 rounded-sm transition-colors ${i < bars ? (isPos ? 'bg-green-500' : 'bg-red-500') : 'bg-surface-600'}`}
            />
          ))}
        </div>
      </td>
      <td className="py-2 px-3 text-xs text-slate-400">{ind.reasoning}</td>
    </tr>
  );
}

function TradeRow({ trade }: { trade: TradeRec }) {
  const isBuy = trade.action === 'BUY';
  const roi = isBuy && trade.target > trade.entry
    ? (((trade.target - trade.entry) / trade.entry) * 100).toFixed(0)
    : null;
  return (
    <tr className="border-b border-surface-700 hover:bg-surface-700/40 transition-colors">
      <td className="py-2 px-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${isBuy ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-orange-500/20 border-orange-500/40 text-orange-400'}`}>
          {isBuy ? '↑ BUY' : '↓ SELL'}
        </span>
      </td>
      <td className="py-2 px-3 font-mono text-sm font-bold whitespace-nowrap">
        <span className={trade.optionType === 'CE' ? 'text-green-300' : 'text-red-300'}>
          {trade.strike.toLocaleString()} {trade.optionType}
        </span>
      </td>
      <td className="py-2 px-3 text-xs text-slate-400 whitespace-nowrap">{trade.expiryLabel}</td>
      <td className="py-2 px-3 text-right font-mono text-white whitespace-nowrap">₹{trade.entry}</td>
      <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
        <span className={isBuy ? 'text-green-400' : 'text-slate-500'}>{isBuy ? `₹${trade.target}` : '₹0'}</span>
      </td>
      <td className="py-2 px-3 text-right font-mono text-red-400 whitespace-nowrap">₹{trade.stopLoss}</td>
      <td className="py-2 px-3 text-right whitespace-nowrap">
        {roi ? <span className="text-xs font-bold text-emerald-400">+{roi}%</span> : <span className="text-xs text-slate-500">premium</span>}
      </td>
      <td className="py-2 px-3 text-xs text-slate-400">{trade.rationale}</td>
    </tr>
  );
}

// ── IndexSection ──────────────────────────────────────────────────────────────

interface IndexSectionProps {
  name: string;
  price: number;
  prevClose: number;
  vix: number;
  atm: number;
  step: number;
  signal: CompositeSignal;
  pcr: number;
  iv: number;
  oiData: OIStrike[];
  expiryDate: Date;
  expiryLabel: string;
  lotSize: number;
}

function IndexSection({
  name, price, prevClose, vix, atm, step,
  signal, pcr, iv, oiData, expiryDate, expiryLabel, lotSize,
}: IndexSectionProps) {
  const change    = price - prevClose;
  const changePct = (change / prevClose) * 100;
  const up        = change >= 0;
  const T = Math.max(0.003, (expiryDate.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000));

  const trades = makeTrades(signal, price, atm, step, expiryLabel, iv, T);

  const scoreBarStyle: React.CSSProperties = signal.score >= 0
    ? { left: '50%', width: `${Math.min(50, signal.score / 2)}%` }
    : { left: `${50 - Math.min(50, -signal.score / 2)}%`, width: `${Math.min(50, -signal.score / 2)}%` };

  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl p-5 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Expiry: <span className="text-slate-300">{expiryLabel}</span>
            &nbsp;·&nbsp;Lot Size: <span className="text-slate-300">{lotSize}</span>
            &nbsp;·&nbsp;IV: <span className="text-slate-300">{(iv * 100).toFixed(1)}%</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold font-mono text-white">
            {price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm font-mono ${up ? 'text-green-400' : 'text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* ── Signal panel ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Big badge */}
        <div className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 ${getSignalBg(signal.signal)}`}>
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Overall Signal</p>
          <p className="text-2xl font-black">{getSignalLabel(signal.signal)}</p>
          <p className="text-xs mt-1 opacity-60">Score: {signal.score > 0 ? '+' : ''}{signal.score}</p>
        </div>

        {/* Meters */}
        <div className="col-span-2 flex flex-col justify-center gap-4">
          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Confidence</span>
              <span className="font-bold text-white">{signal.confidence}%</span>
            </div>
            <div className="h-2.5 bg-surface-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${signal.signal === 'NEUTRAL' ? 'bg-yellow-500' : (signal.signal === 'STRONG_BUY' || signal.signal === 'BUY') ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
          </div>

          {/* Directional score bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>◀ Bearish</span>
              <span>Directional Score</span>
              <span>Bullish ▶</span>
            </div>
            <div className="relative h-2.5 bg-surface-700 rounded-full overflow-hidden">
              <div className="absolute top-0 left-1/2 w-px h-full bg-slate-500 z-10" />
              <div
                className={`absolute top-0 h-full transition-all duration-700 ${signal.score >= 0 ? 'bg-green-500 rounded-r-full' : 'bg-red-500 rounded-l-full'}`}
                style={scoreBarStyle}
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'ATM Strike', value: atm.toLocaleString(), color: 'text-yellow-400' },
              { label: 'PCR',        value: pcr.toFixed(2),       color: pcr > 1 ? 'text-green-400' : 'text-red-400' },
              { label: 'India VIX',  value: vix.toFixed(2),       color: vix < 14 ? 'text-green-400' : vix > 20 ? 'text-red-400' : 'text-yellow-400' },
              { label: 'IV %',       value: `${(iv * 100).toFixed(1)}%`, color: 'text-purple-400' },
            ].map(m => (
              <div key={m.label} className="bg-surface-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className={`text-sm font-bold font-mono mt-0.5 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Indicator breakdown ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Signal Breakdown</h3>
        <div className="overflow-x-auto rounded-lg border border-surface-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600 bg-surface-700/50 text-xs text-slate-400">
                <th className="py-2 px-3 text-left">Indicator</th>
                <th className="py-2 px-3 text-right">Value</th>
                <th className="py-2 px-3 text-right">Signal</th>
                <th className="py-2 px-3 text-right">Strength</th>
                <th className="py-2 px-3 text-left">Analysis</th>
              </tr>
            </thead>
            <tbody>
              {signal.indicators.map(ind => <IndicatorRow key={ind.indicator} ind={ind} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Trade recommendations ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">💡 Suggested Trades</h3>
        <div className="overflow-x-auto rounded-lg border border-surface-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600 bg-surface-700/50 text-xs text-slate-400">
                <th className="py-2 px-3 text-left">Action</th>
                <th className="py-2 px-3 text-left">Contract</th>
                <th className="py-2 px-3 text-left">Expiry</th>
                <th className="py-2 px-3 text-right">Entry ₹</th>
                <th className="py-2 px-3 text-right">Target ₹</th>
                <th className="py-2 px-3 text-right">SL ₹</th>
                <th className="py-2 px-3 text-right">Return</th>
                <th className="py-2 px-3 text-left">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => <TradeRow key={i} trade={t} />)}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          ⚠️ For educational purposes only. Not financial advice. F&O trading involves substantial risk of capital loss.
        </p>
      </div>

      {/* ── OI Distribution Chart ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Open Interest by Strike</h3>
        <div className="bg-surface-700/20 rounded-lg border border-surface-600 p-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={oiData} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
              <XAxis
                dataKey="strike"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => step >= 100 ? `${(v / 1000).toFixed(1)}K` : `${v}`}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{ background: '#131925', border: '1px solid #2d3a55', fontSize: 11 }}
                formatter={(v: unknown, n: string | number | undefined) => [`${((v as number) / 1000).toFixed(0)}K lots`, n === 'callOI' ? 'Call OI' : 'Put OI'] as [string, string]}
                labelFormatter={(l: unknown) => `Strike: ₹${Number(l).toLocaleString()}`}
              />
              <ReferenceLine
                x={atm}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'ATM', fill: '#f59e0b', fontSize: 10, position: 'top' }}
              />
              <Bar dataKey="callOI" name="callOI" radius={[3, 3, 0, 0]}>
                {oiData.map((d, i) => (
                  <Cell key={i} fill={d.strike >= atm ? '#22c55e' : '#22c55e44'} />
                ))}
              </Bar>
              <Bar dataKey="putOI" name="putOI" radius={[3, 3, 0, 0]}>
                {oiData.map((d, i) => (
                  <Cell key={i} fill={d.strike <= atm ? '#ef4444' : '#ef444444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-2 bg-green-500 rounded-sm inline-block" />Call OI (resistance)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-2 bg-red-500 rounded-sm inline-block" />Put OI (support)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const NIFTY_PREV  = 22322.25;
const BN_PREV     = 48432.50;
const NIFTY_CALL_OI = 8_500_000;
const BN_CALL_OI    = 6_200_000;

export default function FOSignals() {
  // Live data state
  const [nifty, setNifty] = useState(() => ({
    price:   22_456.80,
    history: initHistory(22_456.80),
    pcr:     1.18,
    iv:      0.142,
  }));
  const [bn, setBn] = useState(() => ({
    price:   48_320.10,
    history: initHistory(48_320.10),
    pcr:     0.92,
    iv:      0.168,
  }));
  const [vix, setVix] = useState(13.42);
  const [tick, setTick] = useState(0);

  // Simulate live market updates every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setNifty(prev => {
        const p = parseFloat((prev.price + (Math.random() - 0.497) * prev.price * 0.0007).toFixed(2));
        return {
          price:   p,
          history: [...prev.history.slice(-29), p],
          pcr:     parseFloat(Math.max(0.5, Math.min(2.5, prev.pcr + (Math.random() - 0.5) * 0.025)).toFixed(2)),
          iv:      parseFloat(Math.max(0.08, Math.min(0.55, prev.iv + (Math.random() - 0.5) * 0.002)).toFixed(4)),
        };
      });
      setBn(prev => {
        const p = parseFloat((prev.price + (Math.random() - 0.497) * prev.price * 0.0009).toFixed(2));
        return {
          price:   p,
          history: [...prev.history.slice(-29), p],
          pcr:     parseFloat(Math.max(0.5, Math.min(2.5, prev.pcr + (Math.random() - 0.5) * 0.025)).toFixed(2)),
          iv:      parseFloat(Math.max(0.08, Math.min(0.55, prev.iv + (Math.random() - 0.5) * 0.002)).toFixed(4)),
        };
      });
      setVix(v => parseFloat(Math.max(8, Math.min(30, v + (Math.random() - 0.5) * 0.06)).toFixed(2)));
      setTick(t => t + 1);
    }, 2_000);
    return () => clearInterval(id);
  }, []);

  // Derived values
  const niftyRSI = useMemo(() => computeRSI(nifty.history), [nifty.history]);
  const bnRSI    = useMemo(() => computeRSI(bn.history),    [bn.history]);

  const niftyATM = Math.round(nifty.price / 50) * 50;
  const bnATM    = Math.round(bn.price / 100) * 100;

  // Max pain oscillates slowly relative to ATM (demonstrates both buy and sell signals)
  const phase = (tick % 24) / 24;
  const niftyMaxPain = Math.round((niftyATM + 75 * Math.sin(phase * 2 * Math.PI)) / 50) * 50;
  const bnMaxPain    = Math.round((bnATM    + 150 * Math.sin(phase * 2 * Math.PI)) / 100) * 100;

  const niftyPutOI = Math.round(NIFTY_CALL_OI * nifty.pcr);
  const bnPutOI    = Math.round(BN_CALL_OI    * bn.pcr);

  const niftySignal = useMemo(() => computeCompositeSignal({
    rsi: niftyRSI, pcr: nifty.pcr, maxPain: niftyMaxPain,
    spot: nifty.price, callOITotal: NIFTY_CALL_OI, putOITotal: niftyPutOI,
    iv: nifty.iv, vix,
  }), [niftyRSI, nifty.pcr, nifty.price, nifty.iv, niftyMaxPain, niftyPutOI, vix]);

  const bnSignal = useMemo(() => computeCompositeSignal({
    rsi: bnRSI, pcr: bn.pcr, maxPain: bnMaxPain,
    spot: bn.price, callOITotal: BN_CALL_OI, putOITotal: bnPutOI,
    iv: bn.iv, vix,
  }), [bnRSI, bn.pcr, bn.price, bn.iv, bnMaxPain, bnPutOI, vix]);

  const expiries  = useMemo(() => getExpiryDates(), []);
  const niftyOI   = useMemo(() => generateOIData(niftyATM, 50, 13),  [niftyATM]);
  const bnOI      = useMemo(() => generateOIData(bnATM, 100, 11),     [bnATM]);

  const now = new Date();

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">F&amp;O Trading Signals</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            NIFTY 50 &amp; Bank Nifty — live buy / sell predictions based on options &amp; technical analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/30 border border-green-500/30 px-3 py-1.5 rounded-full font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            LIVE
          </span>
          <span className="text-xs font-mono text-slate-300">
            🕐 {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Market overview strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {([
          {
            label: 'NIFTY 50',
            value: nifty.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
            changePct: ((nifty.price - NIFTY_PREV) / NIFTY_PREV) * 100,
            sig: niftySignal.signal,
          },
          {
            label: 'BANK NIFTY',
            value: bn.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
            changePct: ((bn.price - BN_PREV) / BN_PREV) * 100,
            sig: bnSignal.signal,
          },
          {
            label: 'India VIX',
            value: vix.toFixed(2),
            changePct: null as number | null,
            sig: null as SignalType | null,
          },
        ] as const).map(item => (
          <div key={item.label} className="bg-surface-800 border border-surface-600 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">{item.label}</p>
            <p className={`text-xl font-bold font-mono ${item.changePct !== null && item.changePct >= 0 ? 'text-green-400' : item.changePct !== null ? 'text-red-400' : item.label === 'India VIX' ? (vix < 14 ? 'text-green-400' : vix > 20 ? 'text-red-400' : 'text-yellow-400') : 'text-white'}`}>
              {item.value}
            </p>
            {item.changePct !== null && (
              <p className={`text-xs font-mono mt-0.5 ${item.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.changePct >= 0 ? '▲' : '▼'} {Math.abs(item.changePct).toFixed(2)}%
              </p>
            )}
            {item.sig && (
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded border mt-1 ${getSignalBg(item.sig)}`}>
                {getSignalLabel(item.sig).replace(/^[^\s]+ /, '')}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Expiry countdown ── */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Expiry Countdown</p>
        <div className="flex flex-wrap gap-3">
          <CountdownCard label="NIFTY Weekly (Thu)"     date={expiries.niftyWeekly} icon="📅" />
          <CountdownCard label="BANKNIFTY Weekly (Wed)" date={expiries.bnWeekly}    icon="⏰" />
          <CountdownCard label="Monthly Expiry"         date={expiries.monthly}     icon="📆" />
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="bg-yellow-900/15 border border-yellow-500/30 rounded-lg px-4 py-2.5 text-xs text-yellow-200/80">
        <strong>⚠️ Simulated data — educational use only.</strong> All prices and signals are generated from synthetic market data.
        This is not financial advice. Futures &amp; Options trading carries substantial risk. Consult a SEBI-registered advisor before trading.
      </div>

      {/* ── NIFTY 50 analysis ── */}
      <IndexSection
        name="NIFTY 50"
        price={nifty.price}
        prevClose={NIFTY_PREV}
        vix={vix}
        atm={niftyATM}
        step={50}
        signal={niftySignal}
        pcr={nifty.pcr}
        iv={nifty.iv}
        oiData={niftyOI}
        expiryDate={expiries.niftyWeekly}
        expiryLabel={formatExpiry(expiries.niftyWeekly)}
        lotSize={50}
      />

      {/* ── BANKNIFTY analysis ── */}
      <IndexSection
        name="BANK NIFTY"
        price={bn.price}
        prevClose={BN_PREV}
        vix={vix}
        atm={bnATM}
        step={100}
        signal={bnSignal}
        pcr={bn.pcr}
        iv={bn.iv}
        oiData={bnOI}
        expiryDate={expiries.bnWeekly}
        expiryLabel={formatExpiry(expiries.bnWeekly)}
        lotSize={15}
      />
    </div>
  );
}
