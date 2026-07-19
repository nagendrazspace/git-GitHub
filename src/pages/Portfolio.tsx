import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppStore } from '../store/appStore';
import type { PortfolioHolding } from '../data/mockData';

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

function HoldingRow({ h }: { h: PortfolioHolding }) {
  const up = h.pnl >= 0;
  return (
    <tr className="border-b border-surface-700 hover:bg-surface-700/40 transition-colors">
      <td className="py-2.5 px-3">
        <div className="font-bold text-white text-sm">{h.symbol}</div>
        <div className="text-xs text-slate-400">{h.name}</div>
      </td>
      <td className="py-2.5 px-3 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full ${h.type === 'stock' ? 'bg-blue-900/60 text-blue-300' : h.type === 'option' ? 'bg-purple-900/60 text-purple-300' : 'bg-orange-900/60 text-orange-300'}`}>
          {h.type}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right font-mono text-slate-300">{h.qty}</td>
      <td className="py-2.5 px-3 text-right font-mono text-slate-300">{h.avgCost.toLocaleString()}</td>
      <td className="py-2.5 px-3 text-right font-mono text-white">{h.currentPrice.toLocaleString()}</td>
      <td className={`py-2.5 px-3 text-right font-mono font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
        {up ? '+' : ''}₹{h.pnl.toLocaleString()}
      </td>
      <td className={`py-2.5 px-3 text-right font-mono ${up ? 'text-green-400' : 'text-red-400'}`}>
        {up ? '+' : ''}{h.pnlPct.toFixed(2)}%
      </td>
    </tr>
  );
}

export default function Portfolio() {
  const { holdings } = useAppStore();
  const [tab, setTab] = useState<'all'|'stock'|'option'|'future'>('all');

  const filtered = holdings.filter(h => tab === 'all' || h.type === tab);
  const totalPnL = holdings.reduce((s, h) => s + h.pnl, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.qty * h.avgCost, 0);
  const totalValue = holdings.reduce((s, h) => s + h.qty * h.currentPrice, 0);

  const pieData = holdings.map((h, i) => ({
    name: h.symbol,
    value: Math.abs(h.qty * h.currentPrice),
    fill: COLORS[i % COLORS.length],
  }));

  const pnlBar = holdings.map(h => ({ symbol: h.symbol, pnl: parseFloat(h.pnl.toFixed(0)) }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Portfolio Tracker</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested', value: `₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, cls: 'text-white' },
          { label: 'Current Value',  value: `₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,  cls: 'text-white' },
          { label: 'Total P&L',      value: `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, cls: totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Return %',       value: `${((totalPnL / totalInvested) * 100).toFixed(2)}%`, cls: totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(c => (
          <div key={c.label} className="bg-surface-800 border border-surface-600 rounded-lg p-4">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Portfolio Allocation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#131925', border: '1px solid #2d3a55', fontSize: 12 }} formatter={(v: unknown) => [`₹${(v as number).toLocaleString()}`, 'Value']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">P&L by Position</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pnlBar} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `₹${v}`} />
              <YAxis type="category" dataKey="symbol" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
              <Tooltip contentStyle={{ background: '#131925', border: '1px solid #2d3a55', fontSize: 12 }} formatter={(v: unknown) => [`₹${v}`, 'P&L']} />
              <Bar dataKey="pnl" radius={[0,3,3,0]}
                fill="#22c55e"
                label={false}
                isAnimationActive={false}
              >
                {pnlBar.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg">
        <div className="flex gap-1 p-3 border-b border-surface-600">
          {(['all','stock','option','future'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${tab === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600 text-xs text-slate-400 uppercase tracking-wide">
                <th className="py-2.5 px-3 text-left">Symbol</th>
                <th className="py-2.5 px-3 text-center">Type</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Avg Cost</th>
                <th className="py-2.5 px-3 text-right">Current</th>
                <th className="py-2.5 px-3 text-right">P&L</th>
                <th className="py-2.5 px-3 text-right">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => <HoldingRow key={h.symbol} h={h} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
