import React, { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Download } from 'lucide-react';
import { downloadCanvasPng } from '../utils/exportData';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function ScientificChart({
  title,
  subtitle,
  xLabel,
  yLabel,
  datasets,
  tall = false,
  exportName = 'scientific_plot.png',
  xMin,
  xMax,
  yMin,
  yMax,
  yType = 'linear',
  headerExtra = null,
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,
        normalized: true,
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#cbd5e1',
              boxWidth: 14,
              boxHeight: 2,
              font: {
                family: "'Inter', sans-serif",
                size: 11,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(6, 10, 24, 0.94)',
            borderColor: 'rgba(0, 229, 255, 0.35)',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
          },
        },
        scales: {
          x: {
            type: 'linear',
            grid: {
              color: 'rgba(56, 189, 248, 0.09)',
            },
            ticks: {
              color: '#8da2c7',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              maxTicksLimit: 8,
            },
            title: {
              display: Boolean(xLabel),
              text: xLabel,
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
            },
          },
          y: {
            type: yType,
            grid: {
              color: 'rgba(56, 189, 248, 0.09)',
            },
            ticks: {
              color: '#8da2c7',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              maxTicksLimit: 7,
            },
            title: {
              display: Boolean(yLabel),
              text: yLabel,
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
            },
          },
        },
      },
    });

    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.options.scales.x.title.text = xLabel || '';
    chart.options.scales.y.title.text = yLabel || '';
    chart.options.scales.x.min = xMin;
    chart.options.scales.x.max = xMax;
    chart.options.scales.y.min = yMin;
    chart.options.scales.y.max = yMax;

    chart.data.datasets = datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || '#00e5ff',
      backgroundColor: ds.bgColor || 'rgba(0, 229, 255, 0.12)',
      borderWidth: ds.borderWidth ?? 1.8,
      borderDash: ds.borderDash || [],
      pointRadius: ds.pointRadius ?? 0,
      pointHoverRadius: 4,
      fill: ds.fill ?? false,
      tension: 0,
      showLine: ds.showLine ?? true,
    }));

    chart.update('none');
  }, [datasets, xLabel, yLabel, xMin, xMax, yMin, yMax]);

  return (
    <div className="sci-card">
      <div className="sci-card-header">
        <div>
          <h3 className="sci-card-title">{title}</h3>
          {subtitle && <p className="sci-card-subtitle">{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {headerExtra}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => downloadCanvasPng(canvasRef.current, exportName)}
            title="Download graph as PNG"
          >
            <Download size={13} /> PNG
          </button>
        </div>
      </div>
      <div className={`chart-box ${tall ? 'tall' : ''}`}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
