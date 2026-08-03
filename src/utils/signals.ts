// ─── F&O Signal computation engine ──────────────────────────────────────────

export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface IndicatorSignal {
  indicator: string;
  value: string;
  signal: SignalType;
  /** Normalised score in range –2 … +2 */
  score: number;
  /** 0–100 weighting used in composite */
  weight: number;
  reasoning: string;
}

export interface CompositeSignal {
  signal: SignalType;
  /** Weighted score –100 … +100 */
  score: number;
  /** Confidence percentage 40–95 */
  confidence: number;
  indicators: IndicatorSignal[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function signalFromScore(score: number): SignalType {
  if (score >= 55) return 'STRONG_BUY';
  if (score >= 20) return 'BUY';
  if (score <= -55) return 'STRONG_SELL';
  if (score <= -20) return 'SELL';
  return 'NEUTRAL';
}

// ── RSI ───────────────────────────────────────────────────────────────────────

export function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const slice = prices.slice(-(period + 1));
  const changes = slice.slice(1).map((p, i) => p - slice[i]);
  const gains = changes.map(c => Math.max(0, c));
  const losses = changes.map(c => Math.max(0, -c));
  const avgGain = gains.reduce((s, g) => s + g, 0) / period;
  const avgLoss = losses.reduce((s, l) => s + l, 0) / period;
  if (avgLoss === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(1));
}

// ── Main composite signal engine ──────────────────────────────────────────────

export function computeCompositeSignal(params: {
  rsi: number;
  pcr: number;
  maxPain: number;
  spot: number;
  callOITotal: number;
  putOITotal: number;
  iv: number;
  vix: number;
}): CompositeSignal {
  const inds: IndicatorSignal[] = [];

  // 1. RSI (weight 20 %)
  let s: number, sig: SignalType, reason: string;
  if      (params.rsi < 30) { s = 2;    sig = 'STRONG_BUY';  reason = 'Heavily oversold — strong bounce expected'; }
  else if (params.rsi < 42) { s = 1.5;  sig = 'BUY';         reason = 'Oversold territory — bullish bias'; }
  else if (params.rsi < 48) { s = 0.5;  sig = 'BUY';         reason = 'Slightly below midline — mild bullish'; }
  else if (params.rsi < 58) { s = -0.5; sig = 'NEUTRAL';     reason = 'Mid-range — no directional bias'; }
  else if (params.rsi < 70) { s = -1;   sig = 'SELL';        reason = 'Approaching overbought — caution advised'; }
  else                       { s = -2;   sig = 'STRONG_SELL'; reason = 'Overbought — pullback likely'; }
  inds.push({ indicator: 'RSI (14)', value: params.rsi.toFixed(1), signal: sig, score: s, weight: 20, reasoning: reason });

  // 2. Put-Call Ratio (weight 25 %)
  if      (params.pcr > 1.5)  { s = 2;    sig = 'STRONG_BUY';  reason = 'Extreme put OI — max pain anchor, contrarian bullish'; }
  else if (params.pcr > 1.2)  { s = 1.5;  sig = 'BUY';         reason = 'High PCR — heavy put OI = strong support floor'; }
  else if (params.pcr > 1.0)  { s = 0.5;  sig = 'BUY';         reason = 'PCR above 1 — slight bullish lean'; }
  else if (params.pcr > 0.85) { s = -0.5; sig = 'NEUTRAL';     reason = 'PCR near equilibrium — balanced market'; }
  else if (params.pcr > 0.7)  { s = -1.5; sig = 'SELL';        reason = 'Low PCR — heavy call OI = resistance ceiling'; }
  else                         { s = -2;   sig = 'STRONG_SELL'; reason = 'Very low PCR — extreme call buildup, bearish'; }
  inds.push({ indicator: 'Put-Call Ratio', value: params.pcr.toFixed(2), signal: sig, score: s, weight: 25, reasoning: reason });

  // 3. Max Pain proximity (weight 20 %)
  const mpDiff = ((params.maxPain - params.spot) / params.spot) * 100;
  if      (mpDiff > 1.5)  { s = 2;    sig = 'STRONG_BUY';  reason = `Max pain ₹${params.maxPain.toLocaleString()} is ${mpDiff.toFixed(1)}% above spot — price likely to rise`; }
  else if (mpDiff > 0.4)  { s = 1;    sig = 'BUY';         reason = `Max pain ${mpDiff.toFixed(1)}% above spot — mild upward gravitational pull`; }
  else if (mpDiff < -1.5) { s = -2;   sig = 'STRONG_SELL'; reason = `Max pain ₹${params.maxPain.toLocaleString()} is ${(-mpDiff).toFixed(1)}% below spot — price likely to fall`; }
  else if (mpDiff < -0.4) { s = -1;   sig = 'SELL';        reason = `Max pain ${(-mpDiff).toFixed(1)}% below spot — mild downward pull`; }
  else                     { s = 0;    sig = 'NEUTRAL';     reason = `Price near max pain ₹${params.maxPain.toLocaleString()} — range-bound expiry likely`; }
  inds.push({ indicator: 'Max Pain', value: `₹${params.maxPain.toLocaleString()}`, signal: sig, score: s, weight: 20, reasoning: reason });

  // 4. OI Analysis — put/call ratio of total OI (weight 20 %)
  const oiRatio = params.putOITotal / (params.callOITotal || 1);
  if      (oiRatio > 1.4) { s = 1.5;  sig = 'BUY';         reason = 'Dominant put OI buildup — strong underlying support'; }
  else if (oiRatio > 1.1) { s = 0.5;  sig = 'BUY';         reason = 'Put OI > Call OI — mild support floor present'; }
  else if (oiRatio < 0.7) { s = -1.5; sig = 'SELL';        reason = 'Dominant call OI — strong overhead resistance'; }
  else if (oiRatio < 0.9) { s = -0.5; sig = 'SELL';        reason = 'Call OI > Put OI — mild resistance overhead'; }
  else                     { s = 0;    sig = 'NEUTRAL';     reason = 'Balanced call/put OI — no strong directional bias'; }
  inds.push({ indicator: 'OI Analysis', value: `P/C: ${oiRatio.toFixed(2)}`, signal: sig, score: s, weight: 20, reasoning: reason });

  // 5. India VIX (weight 15 %)
  if      (params.vix < 11) { s = 1;    sig = 'BUY';         reason = 'Very low VIX — calm trending market, cheap options'; }
  else if (params.vix < 14) { s = 0.5;  sig = 'NEUTRAL';     reason = 'Low VIX — moderate volatility, option buyers favoured'; }
  else if (params.vix < 18) { s = -0.5; sig = 'NEUTRAL';     reason = 'Elevated VIX — uncertainty, hedge your positions'; }
  else if (params.vix < 23) { s = -1;   sig = 'SELL';        reason = 'High VIX — sell options, reduce naked longs'; }
  else                       { s = -2;   sig = 'STRONG_SELL'; reason = 'Extreme fear — avoid aggressive long positions'; }
  inds.push({ indicator: 'India VIX', value: params.vix.toFixed(2), signal: sig, score: s, weight: 15, reasoning: reason });

  // Composite
  const totalW = inds.reduce((acc, ind) => acc + ind.weight, 0);
  const wScore = inds.reduce((acc, ind) => acc + (ind.score / 2) * ind.weight, 0) / totalW;
  const compositeScore = parseFloat((wScore * 100).toFixed(1));

  // Confidence: penalise disagreement among indicators
  const scores = inds.map(ind => ind.score / 2);
  const mean = scores.reduce((a, v) => a + v, 0) / scores.length;
  const variance = scores.reduce((a, v) => a + (v - mean) ** 2, 0) / scores.length;
  const agreement = Math.max(0, 1 - Math.sqrt(variance));
  const confidence = parseFloat(
    Math.min(95, Math.max(40, Math.abs(compositeScore) * 0.55 + 42 + agreement * 18)).toFixed(0)
  );

  return { signal: signalFromScore(compositeScore), score: compositeScore, confidence, indicators: inds };
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function getSignalColor(signal: SignalType): string {
  switch (signal) {
    case 'STRONG_BUY':  return 'text-emerald-400';
    case 'BUY':         return 'text-green-400';
    case 'NEUTRAL':     return 'text-yellow-300';
    case 'SELL':        return 'text-orange-400';
    case 'STRONG_SELL': return 'text-red-400';
  }
}

export function getSignalBg(signal: SignalType): string {
  switch (signal) {
    case 'STRONG_BUY':  return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    case 'BUY':         return 'bg-green-500/15 border-green-500/40 text-green-400';
    case 'NEUTRAL':     return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
    case 'SELL':        return 'bg-orange-500/15 border-orange-500/40 text-orange-400';
    case 'STRONG_SELL': return 'bg-red-500/20 border-red-500/50 text-red-400';
  }
}

export function getSignalLabel(signal: SignalType): string {
  switch (signal) {
    case 'STRONG_BUY':  return '⬆⬆ STRONG BUY';
    case 'BUY':         return '⬆ BUY';
    case 'NEUTRAL':     return '↔ NEUTRAL';
    case 'SELL':        return '⬇ SELL';
    case 'STRONG_SELL': return '⬇⬇ STRONG SELL';
  }
}
