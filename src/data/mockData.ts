// ─── Mock market data ────────────────────────────────────────────────────────

export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  high52: number;
  low52: number;
  sector: string;
  rsi: number;
}

export interface OptionLeg {
  strike: number;
  expiry: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  oi: number;
  volume: number;
}

export interface Future {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  expiry: string;
  oi: number;
  basis: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tags: string[];
  summary: string;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  type: 'stock' | 'option' | 'future';
  qty: number;
  avgCost: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rnd(min: number, max: number, dp = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dp));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── OHLC generator ───────────────────────────────────────────────────────────

export function generateOHLC(days = 120, basePrice = 500): OHLCData[] {
  const data: OHLCData[] = [];
  let price = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    // skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const open = price;
    const change = rnd(-15, 15);
    const close = parseFloat((open + change).toFixed(2));
    const high = parseFloat((Math.max(open, close) + rnd(1, 8)).toFixed(2));
    const low = parseFloat((Math.min(open, close) - rnd(1, 8)).toFixed(2));
    price = close;
    data.push({
      time: d.toISOString().split('T')[0],
      open, high, low, close,
      volume: randInt(1_000_000, 20_000_000),
    });
  }
  return data;
}

// ─── Indices ──────────────────────────────────────────────────────────────────

export const indices = [
  { symbol: 'NIFTY 50',  price: 22_456.80, change: 134.55, changePct: 0.60 },
  { symbol: 'SENSEX',    price: 74_012.30, change: 398.20, changePct: 0.54 },
  { symbol: 'BANKNIFTY', price: 48_320.10, change: -112.40, changePct: -0.23 },
  { symbol: 'S&P 500',   price:  5_320.45, change: 28.60, changePct: 0.54 },
  { symbol: 'NASDAQ',    price: 18_890.20, change: -45.30, changePct: -0.24 },
  { symbol: 'DOW',       price: 39_150.60, change: 112.80, changePct: 0.29 },
];

// ─── Stocks ───────────────────────────────────────────────────────────────────

export const stocks: Stock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2845.60, change: 32.10, changePct: 1.14, volume: 8_500_000, marketCap: 19_24_000, pe: 28.4, eps: 100.2, high52: 3217, low52: 2220, sector: 'Energy', rsi: 58.2 },
  { symbol: 'TCS',      name: 'Tata Consultancy Services', price: 3980.45, change: -18.30, changePct: -0.46, volume: 2_100_000, marketCap: 14_52_000, pe: 30.1, eps: 132.2, high52: 4305, low52: 3210, sector: 'IT', rsi: 44.1 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1612.70, change: 9.80, changePct: 0.61, volume: 12_400_000, marketCap: 12_24_000, pe: 20.3, eps: 79.4, high52: 1794, low52: 1363, sector: 'Finance', rsi: 52.7 },
  { symbol: 'INFY',     name: 'Infosys', price: 1745.20, change: -12.50, changePct: -0.71, volume: 5_600_000, marketCap: 7_24_000, pe: 25.8, eps: 67.6, high52: 1946, low52: 1351, sector: 'IT', rsi: 41.3 },
  { symbol: 'ICICIBANK',name: 'ICICI Bank', price: 1093.40, change: 15.60, changePct: 1.45, volume: 18_700_000, marketCap: 7_68_000, pe: 18.7, eps: 58.5, high52: 1196, low52: 898, sector: 'Finance', rsi: 63.8 },
  { symbol: 'HINDUNILVR',name:'Hindustan Unilever', price: 2418.90, change: 8.30, changePct: 0.34, volume: 1_800_000, marketCap: 5_68_000, pe: 56.2, eps: 43.0, high52: 2859, low52: 2172, sector: 'FMCG', rsi: 49.6 },
  { symbol: 'BAJFINANCE',name:'Bajaj Finance', price: 7124.50, change: -89.20, changePct: -1.24, volume: 3_200_000, marketCap: 4_30_000, pe: 35.6, eps: 200.1, high52: 8192, low52: 6187, sector: 'Finance', rsi: 38.9 },
  { symbol: 'AAPL',     name: 'Apple Inc.', price: 213.45, change: 2.30, changePct: 1.09, volume: 62_000_000, marketCap: 3_300_000, pe: 34.2, eps: 6.24, high52: 237, low52: 164, sector: 'Technology', rsi: 61.4 },
  { symbol: 'MSFT',     name: 'Microsoft Corp.', price: 417.80, change: 5.60, changePct: 1.36, volume: 22_000_000, marketCap: 3_100_000, pe: 38.7, eps: 10.79, high52: 468, low52: 310, sector: 'Technology', rsi: 66.2 },
  { symbol: 'NVDA',     name: 'Nvidia Corp.', price: 875.30, change: 28.40, changePct: 3.35, volume: 45_000_000, marketCap: 2_150_000, pe: 72.4, eps: 12.09, high52: 974, low52: 462, sector: 'Technology', rsi: 72.1 },
];

// ─── Options chain ─────────────────────────────────────────────────────────

export function generateOptionsChain(spotPrice: number, expiry: string): OptionLeg[] {
  const strikes = [-300,-250,-200,-150,-100,-50,0,50,100,150,200,250,300]
    .map(d => Math.round((spotPrice + d) / 50) * 50);
  const legs: OptionLeg[] = [];
  strikes.forEach(strike => {
    const moneyness = (spotPrice - strike) / spotPrice;
    const callDelta = Math.max(0.01, Math.min(0.99, 0.5 + moneyness * 2));
    const putDelta  = callDelta - 1;
    const iv = rnd(0.15, 0.45);
    const gamma = rnd(0.001, 0.02);
    const theta = -rnd(5, 40);
    const vega  = rnd(50, 300);
    const callMid = Math.max(0.05, rnd(0, Math.max(0, spotPrice - strike + rnd(10, 60))));
    const putMid  = Math.max(0.05, rnd(0, Math.max(0, strike - spotPrice + rnd(10, 60))));

    legs.push({ strike, expiry, type: 'call', bid: parseFloat((callMid - 2).toFixed(2)), ask: parseFloat((callMid + 2).toFixed(2)), iv, delta: callDelta, gamma, theta, vega, oi: randInt(1000, 200000), volume: randInt(100, 50000) });
    legs.push({ strike, expiry, type: 'put',  bid: parseFloat((putMid - 2).toFixed(2)),  ask: parseFloat((putMid + 2).toFixed(2)),  iv, delta: putDelta, gamma, theta, vega, oi: randInt(1000, 200000), volume: randInt(100, 50000) });
  });
  return legs;
}

// ─── Futures ──────────────────────────────────────────────────────────────────

export const futures: Future[] = [
  { symbol: 'NIFTY-FUT',   name: 'Nifty 50 Futures',     price: 22501.25, change: 138.10, changePct: 0.62, expiry: '2024-07-25', oi: 1_234_567, basis: 44.45, volume: 456_789 },
  { symbol: 'BNKFUT',      name: 'Bank Nifty Futures',   price: 48412.50, change: -105.30, changePct: -0.22, expiry: '2024-07-25', oi: 987_654, basis: 92.40, volume: 234_567 },
  { symbol: 'CRUDEOIL-FUT',name: 'Crude Oil Futures',    price: 6842.00, change: 124.00, changePct: 1.85, expiry: '2024-07-19', oi: 234_567, basis: 12.10, volume: 123_456 },
  { symbol: 'GOLD-FUT',    name: 'Gold Futures (MCX)',   price: 71240.00, change: 310.00, changePct: 0.44, expiry: '2024-08-05', oi: 345_678, basis: 180.0, volume: 67_890 },
  { symbol: 'SILVER-FUT',  name: 'Silver Futures (MCX)', price: 84320.00, change: -420.00, changePct: -0.50, expiry: '2024-08-05', oi: 123_456, basis: 95.0, volume: 45_678 },
  { symbol: 'USDINR-FUT',  name: 'USD/INR Futures',      price: 83.64, change: 0.12, changePct: 0.14, expiry: '2024-07-26', oi: 2_345_678, basis: 0.08, volume: 890_123 },
  { symbol: 'ES1!',        name: 'S&P 500 E-mini',       price: 5331.50, change: 30.25, changePct: 0.57, expiry: '2024-09-20', oi: 3_456_789, basis: 11.05, volume: 1_234_567 },
  { symbol: 'NQ1!',        name: 'Nasdaq 100 E-mini',    price: 18945.75, change: -39.50, changePct: -0.21, expiry: '2024-09-20', oi: 1_234_567, basis: 55.55, volume: 567_890 },
];

// ─── News ─────────────────────────────────────────────────────────────────────

export const newsItems: NewsItem[] = [
  { id:'1', headline: 'RBI holds repo rate steady at 6.5%; maintains withdrawal of accommodation', source: 'Economic Times', time: '10:32 AM', sentiment: 'neutral', tags: ['RBI','Monetary Policy'], summary: 'The Reserve Bank of India kept its benchmark repo rate unchanged at 6.5% for the seventh consecutive time, signaling continued vigilance against inflation.' },
  { id:'2', headline: 'Nifty scales new high as IT stocks rally on strong Q1 results', source: 'Mint', time: '11:15 AM', sentiment: 'bullish', tags: ['NIFTY','IT'], summary: 'Indian benchmark indices touched record highs driven by strong quarterly earnings from top-tier IT companies, with TCS and Infosys posting beats on margin guidance.' },
  { id:'3', headline: 'Bajaj Finance Q1 profit dips 15% on higher provisions; stock under pressure', source: 'Business Standard', time: '12:00 PM', sentiment: 'bearish', tags: ['BAJFINANCE','Results'], summary: 'Bajaj Finance reported a 15% year-on-year decline in net profit due to elevated provisions and rising credit costs in the unsecured lending segment.' },
  { id:'4', headline: 'Crude oil surges 3% on Middle East tensions; OMC stocks bleed', source: 'Reuters', time: '1:30 PM', sentiment: 'bearish', tags: ['CrudeOil','OMC'], summary: 'International oil prices jumped as geopolitical tensions in the Middle East escalated, putting pressure on oil marketing companies like HPCL and BPCL.' },
  { id:'5', headline: 'FII net buyers for 5th consecutive session; DII selling offsets gains', source: 'CNBC TV18', time: '2:45 PM', sentiment: 'bullish', tags: ['FII','DII','Flows'], summary: 'Foreign institutional investors continued their buying streak while domestic institutions turned net sellers, indicating mixed institutional sentiment.' },
  { id:'6', headline: 'SEBI proposes new margin framework for options; PCR hits 3-month high', source: 'Moneycontrol', time: '3:20 PM', sentiment: 'neutral', tags: ['SEBI','Options','PCR'], summary: 'Market regulator SEBI has proposed revised margin requirements for options trading amid rising volumes, as the Put-Call Ratio touched its highest level in three months.' },
  { id:'7', headline: 'Apple beats Q3 estimates; Services revenue hits all-time high', source: 'Bloomberg', time: '4:05 PM', sentiment: 'bullish', tags: ['AAPL','Earnings'], summary: 'Apple Inc. reported better-than-expected Q3 results driven by record Services revenue, offsetting continued softness in iPhone sales.' },
  { id:'8', headline: 'Nvidia unveils next-gen AI chip; stock hits all-time high', source: 'The Street', time: '5:00 PM', sentiment: 'bullish', tags: ['NVDA','AI','Technology'], summary: 'Nvidia unveiled its next-generation AI accelerator chip at an industry conference, sending its stock to a new all-time high on expectations of further market share gains.' },
];

// ─── Portfolio ────────────────────────────────────────────────────────────────

export const portfolio: PortfolioHolding[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'stock', qty: 50,  avgCost: 2680, currentPrice: 2845.60, pnl: 8280,  pnlPct: 6.18 },
  { symbol: 'TCS',      name: 'Tata Consultancy',    type: 'stock', qty: 20,  avgCost: 4100, currentPrice: 3980.45, pnl: -2391, pnlPct: -2.91 },
  { symbol: 'AAPL',     name: 'Apple Inc.',          type: 'stock', qty: 30,  avgCost: 195,  currentPrice: 213.45,  pnl: 553.5, pnlPct: 9.46 },
  { symbol: 'NVDA',     name: 'Nvidia Corp.',        type: 'stock', qty: 10,  avgCost: 780,  currentPrice: 875.30,  pnl: 953,   pnlPct: 12.22 },
  { symbol: 'NIFTY22500CE', name: 'NIFTY 22500 CE Jul', type: 'option', qty: 75, avgCost: 120, currentPrice: 188.5, pnl: 5137.5, pnlPct: 57.08 },
  { symbol: 'NIFTY22300PE', name: 'NIFTY 22300 PE Jul', type: 'option', qty: 75, avgCost: 85,  currentPrice: 42.0,  pnl: -3225, pnlPct: -50.59 },
  { symbol: 'CRUDEOIL-FUT', name: 'Crude Oil Aug Fut',  type: 'future', qty: 1, avgCost: 6720, currentPrice: 6842, pnl: 122,   pnlPct: 1.82 },
];
