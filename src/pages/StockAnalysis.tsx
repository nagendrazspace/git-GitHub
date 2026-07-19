import { useState } from 'react';
import { CandlestickChart } from '../components/charts/CandlestickChart';
import { RSIPanel, MACDPanel } from '../components/charts/IndicatorPanels';
import { useAppStore } from '../store/appStore';
import { generateOHLC } from '../data/mockData';
import { formatNumber } from '../utils/finance';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];

export default function StockAnalysis() {
  const { stocks, selectedSymbol, setSelectedSymbol, chartData } = useAppStore();
  const [tf, setTf] = useState('3M');
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  const stock = stocks.find(s => s.symbol === selectedSymbol) ?? stocks[0];

  // trim data based on timeframe
  const tfDays: Record<string, number> = { '1D':1,'1W':5,'1M':22,'3M':66,'6M':132,'1Y':252,'5Y':1260 };
  const displayData = chartData.slice(-Math.min(chartData.length, tfDays[tf] ?? 66));
  const freshData = displayData.length < 5 ? generateOHLC(66, stock.price) : displayData;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={selectedSymbol}
          onChange={e => setSelectedSymbol(e.target.value)}
          className="bg-surface-700 border border-surface-500 text-white text-sm rounded px-3 py-2"
        >
          {stocks.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} – {s.name}</option>)}
        </select>
        <h1 className="text-2xl font-bold text-white">{stock.name}</h1>
        <span className={`text-2xl font-mono font-bold ${stock.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ₹{stock.price.toLocaleString()}
        </span>
        <span className={`text-sm ${stock.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {stock.changePct >= 0 ? '▲' : '▼'} {stock.change.toFixed(2)} ({Math.abs(stock.changePct).toFixed(2)}%)
        </span>
      </div>

      {/* Fundamentals strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { l: 'Market Cap', v: `₹${formatNumber(stock.marketCap)} Cr` },
          { l: 'P/E Ratio', v: stock.pe.toFixed(1) },
          { l: 'EPS (TTM)', v: `₹${stock.eps}` },
          { l: '52W High', v: `₹${stock.high52}` },
          { l: '52W Low', v: `₹${stock.low52}` },
          { l: 'Volume', v: formatNumber(stock.volume) },
        ].map(item => (
          <div key={item.l} className="bg-surface-800 border border-surface-600 rounded p-3">
            <p className="text-xs text-slate-500">{item.l}</p>
            <p className="text-sm font-bold text-white mt-1">{item.v}</p>
          </div>
        ))}
      </div>

      {/* Chart + controls */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex gap-1">
            {TIMEFRAMES.map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${tf === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-surface-600'}`}
              >{t}</button>
            ))}
          </div>
          <div className="flex-1" />
          <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={showRSI} onChange={e => setShowRSI(e.target.checked)} className="accent-brand-500" /> RSI
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={showMACD} onChange={e => setShowMACD(e.target.checked)} className="accent-brand-500" /> MACD
          </label>
        </div>

        <CandlestickChart data={freshData} height={350} />

        {showRSI && (
          <div className="mt-3">
            <RSIPanel data={freshData} />
          </div>
        )}
        {showMACD && (
          <div className="mt-3">
            <MACDPanel data={freshData} />
          </div>
        )}
      </div>

      {/* Analyst ratings */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Analyst Consensus</h3>
        <div className="flex items-center gap-6">
          {[['Strong Buy', 8, 'text-green-400'], ['Buy', 5, 'text-green-300'], ['Hold', 3, 'text-yellow-400'], ['Sell', 1, 'text-red-300'], ['Strong Sell', 0, 'text-red-400']].map(([label, count, cls]) => (
            <div key={label as string} className="flex flex-col items-center">
              <span className={`text-xl font-bold ${cls}`}>{count as number}</span>
              <span className="text-xs text-slate-500 text-center">{label}</span>
            </div>
          ))}
          <div className="ml-4 flex flex-col">
            <span className="text-sm text-slate-400">Target Price</span>
            <span className="text-lg font-bold text-green-400">₹{(stock.price * 1.18).toFixed(0)}</span>
            <span className="text-xs text-slate-500">+18% upside</span>
          </div>
        </div>
      </div>

      {/* Support & Resistance */}
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Technical Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            { l: 'R3', v: (stock.price * 1.06).toFixed(1), cls: 'text-red-400' },
            { l: 'R2', v: (stock.price * 1.04).toFixed(1), cls: 'text-red-300' },
            { l: 'R1', v: (stock.price * 1.02).toFixed(1), cls: 'text-red-200' },
            { l: 'Pivot', v: stock.price.toFixed(1), cls: 'text-yellow-400' },
            { l: 'S1', v: (stock.price * 0.98).toFixed(1), cls: 'text-green-200' },
            { l: 'S2', v: (stock.price * 0.96).toFixed(1), cls: 'text-green-400' },
          ].map(item => (
            <div key={item.l} className="bg-surface-700 rounded p-2 flex justify-between">
              <span className="text-slate-400">{item.l}</span>
              <span className={`font-mono font-semibold ${item.cls}`}>{item.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
