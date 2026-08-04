# TradeAnalyst Pro 📉

A full-featured **Stock, Futures & Options** analysis web application built with React + TypeScript + Vite.

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | Market overview — indices, top gainers/losers, fear & greed, sector heatmap |
| **Stock Analysis** | Candlestick chart (lightweight-charts) with RSI, MACD, support/resistance, analyst ratings |
| **Options Chain** | Full options chain table with Greeks (Δ, Γ, Θ, Vega), IV, OI, PCR, Max Pain |
| **Strategy Builder** | Visual payoff diagram for 8 strategies; Black-Scholes pricing built-in |
| **Futures Dashboard** | Futures table, term structure chart, rollover analysis |
| **Stock Screener** | Filter by sector, P/E, RSI, 52W high/low, volume |
| **News & Sentiment** | News feed with bullish/bearish/neutral sentiment tags |
| **Portfolio Tracker** | Holdings P&L, allocation pie chart, position breakdown |

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** — dark trading-platform theme
- **lightweight-charts** — TradingView-style candlestick charts
- **Recharts** — RSI, MACD, payoff diagrams, pie/bar charts
- **Zustand** — state management
- **React Router** — client-side routing
- **Black-Scholes** — implemented in JS for options pricing/Greeks

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

## iOS app

The project is packaged for iOS with Capacitor. Run the following commands on macOS with
Xcode installed:

```bash
npm install
npm run ios:sync
npm run ios:open
```

Build and run the `App` target from Xcode on an iOS Simulator or connected device. Configure
your Apple development team and signing in Xcode before installing on a physical device or
distributing through the App Store. The generated native project is in `ios/`.
