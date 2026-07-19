// Black-Scholes options pricing model

export function blackScholes(
  S: number,   // spot price
  K: number,   // strike price
  T: number,   // time to expiry in years
  r: number,   // risk-free rate
  sigma: number, // implied volatility
  type: 'call' | 'put'
): number {
  if (T <= 0) return Math.max(0, type === 'call' ? S - K : K - S);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  if (type === 'call') return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  return K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
}

export function calcGreeks(S: number, K: number, T: number, r: number, sigma: number, type: 'call' | 'put') {
  if (T <= 0) return { delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0 };
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const delta = type === 'call' ? normCDF(d1) : normCDF(d1) - 1;
  const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T));
  const theta = (type === 'call')
    ? (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365
    : (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCDF(-d2)) / 365;
  const vega = S * Math.sqrt(T) * normPDF(d1) / 100;
  return { delta, gamma, theta, vega };
}

function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function calcIVRank(currentIV: number, ivMin: number, ivMax: number): number {
  return ((currentIV - ivMin) / (ivMax - ivMin)) * 100;
}

export function calcMaxPain(chain: { strike: number; calls_oi: number; puts_oi: number }[], spotPrice: number): number {
  let minPain = Infinity;
  let maxPainStrike = spotPrice;
  const strikes = chain.map(c => c.strike);
  for (const s of strikes) {
    let pain = 0;
    for (const c of chain) {
      pain += c.calls_oi * Math.max(0, s - c.strike);
      pain += c.puts_oi * Math.max(0, c.strike - s);
    }
    if (pain < minPain) { minPain = pain; maxPainStrike = s; }
  }
  return maxPainStrike;
}

export function calcPCR(putOI: number, callOI: number): number {
  return callOI > 0 ? putOI / callOI : 0;
}

export function formatNumber(n: number, digits = 2): string {
  if (Math.abs(n) >= 1e7) return (n / 1e7).toFixed(digits) + ' Cr';
  if (Math.abs(n) >= 1e5) return (n / 1e5).toFixed(digits) + ' L';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(digits) + 'K';
  return n.toFixed(digits);
}
