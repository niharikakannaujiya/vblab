import React, { useEffect, useRef } from 'react';
import { computeKinematics } from '../physics/doublePendulum';
import { Download } from 'lucide-react';
import { downloadCanvasPng } from '../utils/exportData';

export function PendulumCanvas({
  stateA,
  stateB,
  params,
  trailA,
  trailB,
  compareMode,
  simTime,
  compact = false,
  title = 'Physical Double Pendulum Apparatus',
  showHeader = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(240, Math.floor(rect.height));

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background clear
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, width, height);

    const totalLen = Math.max(0.4, params.L1 + params.L2);
    const radiusPx = Math.min(width, height) * 0.41;
    const pxPerMeter = radiusPx / totalLen;
    const pivotX = width * 0.5;
    const pivotY = height * 0.44;

    // Subtle polar / Cartesian grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    const gridStep = Math.max(28, pxPerMeter * 0.5);
    for (let x = pivotX % gridStep; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = pivotY % gridStep; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer reach circle
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, totalLen * pxPerMeter, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.14)';
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertical reference axis from pivot
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + totalLen * pxPerMeter * 0.85);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Gravity arrow indicator (bottom right)
    const gx = width - 46;
    const gy = height - 62;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx - 4, gy + 20);
    ctx.lineTo(gx + 4, gy + 20);
    ctx.lineTo(gx, gy + 28);
    ctx.closePath();
    ctx.fill();
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`g=${params.g.toFixed(2)}`, gx - 26, gy - 6);

    const toCanvas = (xMeters, yMeters) => ({
      x: pivotX + xMeters * pxPerMeter,
      y: pivotY - yMeters * pxPerMeter,
    });

    const drawTrail = (trail, rgbColor) => {
      if (!trail || trail.length < 2) return;
      const len = trail.length;
      for (let i = 1; i < len; i++) {
        const p0 = toCanvas(trail[i - 1].x, trail[i - 1].y);
        const p1 = toCanvas(trail[i].x, trail[i].y);
        const alpha = (i / len) * 0.82;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(${rgbColor}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2 + (i / len) * 1.8;
        ctx.stroke();
      }
    };

    if (compareMode && trailB) {
      drawTrail(trailB, '245, 158, 11');
    }
    drawTrail(trailA, '0, 229, 255');

    const drawPendulumBody = (st, colors, isGhost = false) => {
      const kin = computeKinematics(st, params);
      const p1 = toCanvas(kin.x1, kin.y1);
      const p2 = toCanvas(kin.x2, kin.y2);

      // Rods
      ctx.save();
      if (isGhost) {
        ctx.globalAlpha = 0.85;
      }

      const rodGrad = ctx.createLinearGradient(pivotX, pivotY, p2.x, p2.y);
      rodGrad.addColorStop(0, colors.rodStart);
      rodGrad.addColorStop(1, colors.rodEnd);

      ctx.strokeStyle = rodGrad;
      ctx.lineWidth = isGhost ? 2.4 : 3.2;
      ctx.lineCap = 'round';
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = isGhost ? 6 : 12;

      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Mass radius scales perceptually with cube root of mass
      const r1 = Math.max(6, Math.min(16, 8.5 * Math.cbrt(params.m1)));
      const r2 = Math.max(6, Math.min(16, 8.5 * Math.cbrt(params.m2)));

      // Mass 1
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, r1, 0, Math.PI * 2);
      ctx.fillStyle = colors.m1Fill;
      ctx.shadowColor = colors.m1Glow;
      ctx.shadowBlur = isGhost ? 8 : 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // Mass 2
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, r2, 0, Math.PI * 2);
      ctx.fillStyle = colors.m2Fill;
      ctx.shadowColor = colors.m2Glow;
      ctx.shadowBlur = isGhost ? 10 : 20;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      if (!isGhost) {
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
        ctx.fillText('m₁', p1.x + r1 + 5, p1.y + 4);
        ctx.fillText('m₂', p2.x + r2 + 5, p2.y + 4);
      } else {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
        ctx.fillText('B', p2.x + r2 + 5, p2.y - 4);
      }

      ctx.restore();
    };

    if (compareMode && stateB) {
      drawPendulumBody(
        stateB,
        {
          rodStart: '#f59e0b',
          rodEnd: '#ec4899',
          glow: 'rgba(245, 158, 11, 0.45)',
          m1Fill: '#fbbf24',
          m1Glow: 'rgba(251, 191, 36, 0.5)',
          m2Fill: '#f43f5e',
          m2Glow: 'rgba(244, 63, 94, 0.6)',
        },
        true
      );
    }

    drawPendulumBody(
      stateA,
      {
        rodStart: '#38bdf8',
        rodEnd: '#a855f7',
        glow: 'rgba(0, 229, 255, 0.55)',
        m1Fill: '#00e5ff',
        m1Glow: 'rgba(0, 229, 255, 0.7)',
        m2Fill: '#a855f7',
        m2Glow: 'rgba(168, 85, 247, 0.85)',
      },
      false
    );

    // Fixed Pivot Hub
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [stateA, stateB, params, trailA, trailB, compareMode, simTime]);

  const innerCanvas = (
    <div className={`pendulum-canvas-wrap ${compact ? 'compact' : ''}`}>
      <canvas ref={canvasRef} className="pendulum-canvas" />
      <div className="canvas-hud">
        <div className="canvas-badge">
          t = {simTime.toFixed(2)} s &nbsp;|&nbsp; θ₁ = {(stateA.theta1 * (180 / Math.PI)).toFixed(1)}° &nbsp;|&nbsp; θ₂ ={' '}
          {(stateA.theta2 * (180 / Math.PI)).toFixed(1)}°
        </div>
        {compareMode && stateB && (
          <div className="canvas-badge" style={{ borderColor: 'rgba(245, 158, 11, 0.45)', color: '#fde68a' }}>
            Twin Mode: Cyan/Purple (A) vs Amber/Rose (B)
          </div>
        )}
      </div>
    </div>
  );

  if (!showHeader) {
    return innerCanvas;
  }

  return (
    <div className="sci-card">
      <div className="sci-card-header">
        <div>
          <h3 className="sci-card-title">{title}</h3>
          <p className="sci-card-subtitle">
            RK4 fixed-step integration (Δt = 2 ms) • Trail reflects tip trajectory of m₂
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => downloadCanvasPng(canvasRef.current, 'pendulum_simulation.png')}
          title="Download simulation frame as PNG"
        >
          <Download size={14} /> PNG
        </button>
      </div>
      {innerCanvas}
    </div>
  );
}
