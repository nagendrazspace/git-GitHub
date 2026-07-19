import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { OHLCData } from '../../data/mockData';

interface Props {
  data: OHLCData[];
  height?: number;
  showVolume?: boolean;
}

export function CandlestickChart({ data, height = 400, showVolume = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const maRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { color: '#131925' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1a2235' }, horzLines: { color: '#1a2235' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#2d3a55' },
      timeScale: { borderColor: '#2d3a55', timeVisible: true },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });
    candleRef.current = candleSeries;

    candleSeries.setData(
      data.map(d => ({ time: d.time as `${number}-${number}-${number}`, open: d.open, high: d.high, low: d.low, close: d.close }))
    );

    // 20-day MA
    const maData = data.map((_, i) => {
      if (i < 19) return null;
      const slice = data.slice(i - 19, i + 1);
      const avg = slice.reduce((s, d) => s + d.close, 0) / 20;
      return { time: data[i].time as `${number}-${number}-${number}`, value: parseFloat(avg.toFixed(2)) };
    }).filter(Boolean) as { time: `${number}-${number}-${number}`; value: number }[];

    const maSeries = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1 });
    maSeries.setData(maData);
    maRef.current = maSeries;

    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volSeries.setData(
        data.map(d => ({ time: d.time as `${number}-${number}-${number}`, value: d.volume, color: d.close >= d.open ? '#22c55e55' : '#ef444455' }))
      );
      volRef.current = volSeries;
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height, showVolume]);

  return <div ref={containerRef} className="w-full rounded" style={{ height }} />;
}
