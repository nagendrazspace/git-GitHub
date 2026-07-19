import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { OHLCData } from '../../data/mockData';

function calcRSI(data: OHLCData[], period = 14): { time: string; rsi: number }[] {
  const result = [];
  for (let i = period; i < data.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - data[j - 1].close;
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    result.push({ time: data[i].time, rsi: parseFloat((100 - 100 / (1 + rs)).toFixed(2)) });
  }
  return result;
}

function calcMACD(data: OHLCData[]): { time: string; macd: number; signal: number; histogram: number }[] {
  const ema = (arr: number[], n: number) => {
    const k = 2 / (n + 1);
    let e = arr[0];
    return arr.map((v, i) => { e = i === 0 ? v : v * k + e * (1 - k); return e; });
  };
  const closes = data.map(d => d.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  return data.slice(26).map((d, i) => ({
    time: d.time,
    macd: parseFloat(macdLine[i + 26].toFixed(2)),
    signal: parseFloat(signalLine[i + 26].toFixed(2)),
    histogram: parseFloat((macdLine[i + 26] - signalLine[i + 26]).toFixed(2)),
  }));
}

interface Props { data: OHLCData[] }

export function RSIPanel({ data }: Props) {
  const rsiData = calcRSI(data);
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">RSI (14)</p>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={rsiData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
          <XAxis dataKey="time" tick={false} />
          <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fill: '#64748b', fontSize: 10 }} width={28} />
          <Tooltip contentStyle={{ background: '#131925', border: '1px solid #2d3a55', borderRadius: 4, fontSize: 11 }} />
          <Line type="monotone" dataKey="rsi" stroke="#a78bfa" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MACDPanel({ data }: Props) {
  const macdData = calcMACD(data);
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">MACD (12, 26, 9)</p>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={macdData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
          <XAxis dataKey="time" tick={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={35} />
          <Tooltip contentStyle={{ background: '#131925', border: '1px solid #2d3a55', borderRadius: 4, fontSize: 11 }} />
          <Area type="monotone" dataKey="histogram" stroke="none"
            fill="#22c55e44"
            fillOpacity={1} />
          <Line type="monotone" dataKey="macd" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="signal" stroke="#f97316" dot={false} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
