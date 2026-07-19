import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { generateOptionsChain, stocks } from '../data/mockData';
import { calcMaxPain, calcPCR } from '../utils/finance';

const EXPIRIES = ['2024-07-25', '2024-08-01', '2024-08-29', '2024-09-26'];

export default function OptionsChain() {
  const { selectedSymbol } = useAppStore();
  const stock = stocks.find(s => s.symbol === selectedSymbol) ?? stocks[0];
  const [expiry, setExpiry] = useState(EXPIRIES[0]);
  const [filter, setFilter] = useState<'all' | 'itm' | 'otm' | 'atm'>('all');

  const chain = useMemo(() => generateOptionsChain(stock.price, expiry), [stock.price, expiry]);
  const calls = chain.filter(o => o.type === 'call');
  const puts  = chain.filter(o => o.type === 'put');

  const strikes = [...new Set(chain.map(o => o.strike))].sort((a, b) => a - b);

  const pcr = calcPCR(
    puts.reduce((s, p) => s + p.oi, 0),
    calls.reduce((s, c) => s + c.oi, 0)
  );

  const maxPainData = strikes.map(s => ({
    strike: s,
    calls_oi: calls.find(c => c.strike === s)?.oi ?? 0,
    puts_oi:  puts.find(p => p.strike === s)?.oi ?? 0,
  }));
  const maxPain = calcMaxPain(maxPainData, stock.price);

  const filteredStrikes = strikes.filter(s => {
    if (filter === 'itm') return s < stock.price;
    if (filter === 'otm') return s > stock.price;
    if (filter === 'atm') return Math.abs(s - stock.price) <= 100;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Options Chain</h1>
        <span className="text-slate-400">{stock.symbol}</span>
        <span className="text-white font-mono">₹{stock.price.toLocaleString()}</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-1 bg-surface-800 border border-surface-600 rounded-lg p-1">
          {EXPIRIES.map(e => (
            <button key={e} onClick={() => setExpiry(e)}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${expiry === e ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>{e}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-800 border border-surface-600 rounded-lg p-1">
          {(['all','itm','otm','atm'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded uppercase transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-4 ml-auto">
          <div className="bg-surface-800 border border-surface-600 rounded px-3 py-1.5 text-xs">
            <span className="text-slate-400">PCR: </span><span className={`font-bold ${pcr > 1 ? 'text-green-400' : 'text-red-400'}`}>{pcr.toFixed(2)}</span>
          </div>
          <div className="bg-surface-800 border border-surface-600 rounded px-3 py-1.5 text-xs">
            <span className="text-slate-400">Max Pain: </span><span className="font-bold text-yellow-400">₹{maxPain.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Chain table */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-600">
              <th colSpan={7} className="py-2 text-center text-green-400 font-semibold bg-green-900/20">CALLS</th>
              <th className="py-2 px-3 text-center text-yellow-400 font-bold bg-surface-700">STRIKE</th>
              <th colSpan={7} className="py-2 text-center text-red-400 font-semibold bg-red-900/20">PUTS</th>
            </tr>
            <tr className="border-b border-surface-600 text-slate-400">
              {['OI','Chg','IV','Delta','Bid','Ask','LTP'].map(h => (
                <th key={h} className="py-1.5 px-2 text-right bg-green-900/10">{h}</th>
              ))}
              <th className="py-1.5 px-3 bg-surface-700" />
              {['LTP','Bid','Ask','Delta','IV','Chg','OI'].map(h => (
                <th key={h} className="py-1.5 px-2 text-right bg-red-900/10">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStrikes.map(strike => {
              const call = calls.find(c => c.strike === strike);
              const put  = puts.find(p => p.strike === strike);
              const isATM = Math.abs(strike - stock.price) < 50;
              return (
                <tr key={strike} className={`border-b border-surface-700 hover:bg-surface-700/50 transition-colors ${isATM ? 'bg-yellow-900/10' : ''}`}>
                  {call ? (
                    <>
                      <td className="py-1.5 px-2 text-right font-mono text-green-300">{(call.oi/1000).toFixed(0)}K</td>
                      <td className="py-1.5 px-2 text-right text-slate-400">—</td>
                      <td className="py-1.5 px-2 text-right text-purple-300">{(call.iv * 100).toFixed(1)}%</td>
                      <td className="py-1.5 px-2 text-right text-blue-300">{call.delta.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right text-slate-300">{call.bid.toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-right text-slate-300">{call.ask.toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-right font-bold text-white">{((call.bid + call.ask)/2).toFixed(1)}</td>
                    </>
                  ) : <td colSpan={7} />}
                  <td className={`py-1.5 px-3 text-center font-bold ${isATM ? 'text-yellow-400' : 'text-white'}`}>{strike}</td>
                  {put ? (
                    <>
                      <td className="py-1.5 px-2 text-right font-bold text-white">{((put.bid + put.ask)/2).toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-right text-slate-300">{put.bid.toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-right text-slate-300">{put.ask.toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-right text-orange-300">{put.delta.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right text-purple-300">{(put.iv * 100).toFixed(1)}%</td>
                      <td className="py-1.5 px-2 text-right text-slate-400">—</td>
                      <td className="py-1.5 px-2 text-right font-mono text-red-300">{(put.oi/1000).toFixed(0)}K</td>
                    </>
                  ) : <td colSpan={7} />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Greeks summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Call IV', value: `${(calls.reduce((s,c)=>s+c.iv,0)/calls.length*100).toFixed(1)}%`, cls: 'text-green-400' },
          { label: 'Avg Put IV',  value: `${(puts.reduce((s,p)=>s+p.iv,0)/puts.length*100).toFixed(1)}%`,  cls: 'text-red-400' },
          { label: 'Total Call OI', value: `${(calls.reduce((s,c)=>s+c.oi,0)/1000).toFixed(0)}K`, cls: 'text-green-400' },
          { label: 'Total Put OI',  value: `${(puts.reduce((s,p)=>s+p.oi,0)/1000).toFixed(0)}K`,  cls: 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="bg-surface-800 border border-surface-600 rounded p-3">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.cls}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
