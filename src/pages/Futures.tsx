import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Futures() {
  const { futures } = useAppStore();
  const [sortKey, setSortKey] = useState<'symbol' | 'changePct' | 'oi'>('changePct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...futures].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const termStructure = [
    { month: 'Jul', price: 22501 },
    { month: 'Aug', price: 22560 },
    { month: 'Sep', price: 22630 },
    { month: 'Oct', price: 22710 },
    { month: 'Nov', price: 22800 },
    { month: 'Dec', price: 22895 },
  ];

  const toggle = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Futures Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total OI (NIFTY)', value: '12.34L Lots', cls: 'text-blue-400' },
          { label: 'Rollover %',        value: '78.4%',        cls: 'text-yellow-400' },
          { label: 'Cost of Carry',     value: '6.8% p.a.',    cls: 'text-green-400' },
          { label: 'Series Ends',        value: '25 Jul 2024', cls: 'text-white' },
        ].map(c => (
          <div key={c.label} className="bg-surface-800 border border-surface-600 rounded p-3">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-lg font-bold mt-1 ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Futures table */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-600 text-slate-400">
              <th className="py-2.5 px-3 text-left cursor-pointer hover:text-white" onClick={() => toggle('symbol')}>Symbol {sortKey === 'symbol' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="py-2.5 px-3 text-left">Name</th>
              <th className="py-2.5 px-3 text-right">Price</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggle('changePct')}>Change {sortKey === 'changePct' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="py-2.5 px-3 text-right">Expiry</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggle('oi')}>Open Interest {sortKey === 'oi' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="py-2.5 px-3 text-right">Basis</th>
              <th className="py-2.5 px-3 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(f => (
              <tr key={f.symbol} className="border-b border-surface-700 hover:bg-surface-700/40 transition-colors">
                <td className="py-2.5 px-3 font-bold text-brand-300">{f.symbol}</td>
                <td className="py-2.5 px-3 text-slate-300">{f.name}</td>
                <td className="py-2.5 px-3 text-right font-mono text-white">{f.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td className={`py-2.5 px-3 text-right font-mono ${f.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {f.changePct >= 0 ? '+' : ''}{f.changePct.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400">{f.expiry}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-300">{f.oi.toLocaleString()}</td>
                <td className={`py-2.5 px-3 text-right font-mono ${f.basis > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {f.basis > 0 ? '+' : ''}{f.basis.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400">{f.volume.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Term structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">NIFTY Futures Term Structure</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={termStructure}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[22400, 23000]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#131925', border: '1px solid #2d3a55', fontSize: 12 }} />
              <Bar dataKey="price" fill="#4fa8f0" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Rollover Analysis</h3>
          <div className="space-y-3">
            {[
              { name: 'NIFTY',      rollover: 78.4, color: 'bg-blue-500' },
              { name: 'BANKNIFTY',  rollover: 71.2, color: 'bg-purple-500' },
              { name: 'CRUDEOIL',   rollover: 65.8, color: 'bg-orange-500' },
              { name: 'GOLD',       rollover: 82.1, color: 'bg-yellow-500' },
              { name: 'USDINR',     rollover: 88.5, color: 'bg-green-500' },
            ].map(r => (
              <div key={r.name}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{r.name}</span><span>{r.rollover}%</span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2">
                  <div className={`h-2 rounded-full ${r.color}`} style={{ width: `${r.rollover}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
