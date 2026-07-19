import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { NewsItem } from '../data/mockData';

const SENTIMENTS = ['All', 'bullish', 'bearish', 'neutral'] as const;

function SentimentBadge({ s }: { s: NewsItem['sentiment'] }) {
  const cls = s === 'bullish' ? 'bg-green-900/60 text-green-300 border border-green-700'
    : s === 'bearish' ? 'bg-red-900/60 text-red-300 border border-red-700'
    : 'bg-slate-700 text-slate-300 border border-slate-500';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{s}</span>;
}

function NewsCard({ item }: { item: NewsItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-4 hover:border-brand-600 transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <SentimentBadge s={item.sentiment} />
            {item.tags.map(t => (
              <span key={t} className="text-xs text-slate-500 bg-surface-700 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{item.headline}</h3>
          {expanded && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.summary}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500">{item.source}</p>
          <p className="text-xs text-slate-500">{item.time}</p>
        </div>
      </div>
    </div>
  );
}

function SentimentGauge() {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Market Sentiment Breakdown</h3>
      <div className="space-y-3">
        {[
          { label: 'Bullish News', count: 12, total: 20, cls: 'bg-green-500' },
          { label: 'Bearish News', count: 5,  total: 20, cls: 'bg-red-500' },
          { label: 'Neutral News', count: 3,  total: 20, cls: 'bg-slate-500' },
        ].map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{s.label}</span><span>{s.count}/{s.total}</span>
            </div>
            <div className="w-full bg-surface-700 rounded-full h-2">
              <div className={`h-2 rounded-full ${s.cls}`} style={{ width: `${(s.count/s.total)*100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-surface-600 pt-3">
        <h4 className="text-xs text-slate-400 mb-2">Sector Sentiment</h4>
        {[
          { sector: 'IT',      sentiment: 'Bearish', cls: 'text-red-400' },
          { sector: 'Finance', sentiment: 'Bullish', cls: 'text-green-400' },
          { sector: 'Energy',  sentiment: 'Bullish', cls: 'text-green-400' },
          { sector: 'FMCG',    sentiment: 'Neutral', cls: 'text-slate-400' },
          { sector: 'Pharma',  sentiment: 'Neutral', cls: 'text-slate-400' },
        ].map(s => (
          <div key={s.sector} className="flex justify-between py-1 text-xs">
            <span className="text-slate-300">{s.sector}</span>
            <span className={s.cls}>{s.sentiment}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function News() {
  const { newsItems } = useAppStore();
  const [filter, setFilter] = useState<'All' | NewsItem['sentiment']>('All');

  const filtered = newsItems.filter(n => filter === 'All' || n.sentiment === filter);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">News & Market Sentiment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            {SENTIMENTS.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === s ? 'bg-brand-600 border-brand-400 text-white' : 'bg-surface-800 border-surface-600 text-slate-400 hover:text-white'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map(item => <NewsCard key={item.id} item={item} />)}
          </div>
        </div>
        <div>
          <SentimentGauge />
        </div>
      </div>
    </div>
  );
}
