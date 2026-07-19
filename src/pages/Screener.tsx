import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import type { Stock } from '../data/mockData';

const SECTORS = ['All', 'IT', 'Finance', 'Energy', 'FMCG', 'Technology'];

export default function Screener() {
  const { stocks } = useAppStore();
  const [sector, setSector] = useState('All');
  const [minPE, setMinPE] = useState('');
  const [maxPE, setMaxPE] = useState('');
  const [minRSI, setMinRSI] = useState('');
  const [maxRSI, setMaxRSI] = useState('');
  const [sortKey, setSortKey] = useState<keyof Stock>('marketCap');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return stocks
      .filter(s => sector === 'All' || s.sector === sector)
      .filter(s => !search || s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
      .filter(s => !minPE || s.pe >= Number(minPE))
      .filter(s => !maxPE || s.pe <= Number(maxPE))
      .filter(s => !minRSI || s.rsi >= Number(minRSI))
      .filter(s => !maxRSI || s.rsi <= Number(maxRSI))
      .sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
        return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
      });
  }, [stocks, sector, search, minPE, maxPE, minRSI, maxRSI, sortKey, sortDir]);

  const toggle = (key: keyof Stock) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const Th = ({ col, label }: { col: keyof Stock; label: string }) => (
    <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white select-none whitespace-nowrap" onClick={() => toggle(col)}>
      {label} {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Stock Screener</h1>

      {/* Filters */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <label className="text-xs text-slate-400">Search</label>
          <input placeholder="Symbol or name…" value={search} onChange={e => setSearch(e.target.value)}
            className="mt-1 w-full bg-surface-700 border border-surface-500 text-white rounded px-3 py-1.5 text-sm placeholder-slate-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Sector</label>
          <select value={sector} onChange={e => setSector(e.target.value)}
            className="mt-1 w-full bg-surface-700 border border-surface-500 text-white rounded px-3 py-1.5 text-sm">
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">P/E Min – Max</label>
          <div className="flex gap-1 mt-1">
            <input placeholder="Min" value={minPE} onChange={e => setMinPE(e.target.value)} type="number"
              className="w-1/2 bg-surface-700 border border-surface-500 text-white rounded px-2 py-1.5 text-sm" />
            <input placeholder="Max" value={maxPE} onChange={e => setMaxPE(e.target.value)} type="number"
              className="w-1/2 bg-surface-700 border border-surface-500 text-white rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">RSI Min – Max</label>
          <div className="flex gap-1 mt-1">
            <input placeholder="Min" value={minRSI} onChange={e => setMinRSI(e.target.value)} type="number"
              className="w-1/2 bg-surface-700 border border-surface-500 text-white rounded px-2 py-1.5 text-sm" />
            <input placeholder="Max" value={maxRSI} onChange={e => setMaxRSI(e.target.value)} type="number"
              className="w-1/2 bg-surface-700 border border-surface-500 text-white rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="flex items-end">
          <button onClick={() => { setSector('All'); setSearch(''); setMinPE(''); setMaxPE(''); setMinRSI(''); setMaxRSI(''); }}
            className="w-full bg-surface-700 border border-surface-500 text-slate-400 hover:text-white rounded px-3 py-1.5 text-sm transition-colors">
            Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">{filtered.length} stocks found</p>

      {/* Table */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-600 text-slate-400 text-xs uppercase tracking-wide">
              <th className="py-2.5 px-3 text-left cursor-pointer hover:text-white" onClick={() => toggle('symbol')}>Symbol</th>
              <th className="py-2.5 px-3 text-left">Name</th>
              <th className="py-2.5 px-3 text-center">Sector</th>
              <Th col="price" label="Price" />
              <Th col="changePct" label="Change %" />
              <Th col="marketCap" label="Mkt Cap" />
              <Th col="pe" label="P/E" />
              <Th col="eps" label="EPS" />
              <Th col="rsi" label="RSI" />
              <Th col="volume" label="Volume" />
              <th className="py-2.5 px-3 text-right">52W Hi/Lo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.symbol} className="border-b border-surface-700 hover:bg-surface-700/40 transition-colors">
                <td className="py-2.5 px-3 font-bold text-brand-300">{s.symbol}</td>
                <td className="py-2.5 px-3 text-slate-300 truncate max-w-[160px]">{s.name}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="bg-surface-600 text-slate-300 text-xs px-2 py-0.5 rounded-full">{s.sector}</span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-white">{s.price.toLocaleString()}</td>
                <td className={`py-2.5 px-3 text-right font-mono ${s.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300">{(s.marketCap/1000).toFixed(0)}K Cr</td>
                <td className="py-2.5 px-3 text-right text-slate-300">{s.pe.toFixed(1)}</td>
                <td className="py-2.5 px-3 text-right text-slate-300">{s.eps}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className={`font-bold ${s.rsi > 70 ? 'text-red-400' : s.rsi < 30 ? 'text-green-400' : 'text-slate-300'}`}>{s.rsi.toFixed(1)}</span>
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400">{(s.volume/1e6).toFixed(1)}M</td>
                <td className="py-2.5 px-3 text-right text-xs">
                  <span className="text-green-400">{s.high52}</span>
                  <span className="text-slate-500"> / </span>
                  <span className="text-red-400">{s.low52}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
