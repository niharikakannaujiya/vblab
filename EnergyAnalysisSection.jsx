import React, { useMemo } from 'react';
import { BatteryCharging, CheckCircle2 } from 'lucide-react';
import { ScientificChart } from './ScientificChart';

export function EnergyAnalysisSection({ history, liveEnergy, initialEnergy }) {
  const absError = Math.abs(liveEnergy.total - initialEnergy);
  const relErrorPct = initialEnergy > 1e-9 ? (absError / initialEnergy) * 100 : 0;
  const isConserved = relErrorPct < 0.05;

  const energyDatasets = useMemo(() => {
    const kData = history.map((p) => ({ x: p.t, y: p.kinetic }));
    const vData = history.map((p) => ({ x: p.t, y: p.potential }));
    const eData = history.map((p) => ({ x: p.t, y: p.total }));
    return [
      { label: 'Kinetic Energy T(t) [J]', data: kData, color: '#f59e0b' },
      { label: 'Potential Energy V(t) [J]', data: vData, color: '#00e5ff' },
      { label: 'Total Mechanical Energy E(t) [J]', data: eData, color: '#10b981', borderWidth: 2.3 },
    ];
  }, [history]);

  const driftDatasets = useMemo(() => {
    const dData = history.map((p) => ({ x: p.t, y: p.total - initialEnergy }));
    return [
      {
        label: 'Energy Residual ΔE(t) = E(t) - E₀ [J]',
        data: dData,
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.16)',
        fill: true,
      },
    ];
  }, [history, initialEnergy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="grid-4">
        <div className="stat-tile">
          <div className="stat-tile-label">Kinetic Energy (T)</div>
          <div className="stat-tile-value" style={{ color: '#fbbf24' }}>
            {liveEnergy.kinetic.toFixed(4)} J
          </div>
          <div className="stat-tile-note">Translational + coupled rotational</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">Potential Energy (V)</div>
          <div className="stat-tile-value" style={{ color: '#00e5ff' }}>
            {liveEnergy.potential.toFixed(4)} J
          </div>
          <div className="stat-tile-note">Zero at downward equilibrium (θ₁=θ₂=0)</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">Total Energy (E = T + V)</div>
          <div className="stat-tile-value" style={{ color: '#34d399' }}>
            {liveEnergy.total.toFixed(4)} J
          </div>
          <div className="stat-tile-note">Initial E₀ = {initialEnergy.toFixed(4)} J</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">Conservation Drift |ΔE / E₀|</div>
          <div className="stat-tile-value" style={{ color: isConserved ? '#34d399' : '#fbbf24' }}>
            {relErrorPct.toFixed(5)} %
          </div>
          <div className="stat-tile-note" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} color="#34d399" />
            {isConserved ? 'Approximately conserved (RK4)' : 'Monitor step stability'}
          </div>
        </div>
      </div>

      <div className="callout-banner emerald" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BatteryCharging size={18} color="#34d399" style={{ flexShrink: 0 }} />
        <span>
          <strong>Conservation Verdict:</strong> Because there is no friction or external torque, the Hamiltonian{' '}
          <code style={{ color: '#eef4ff' }}>H = T + V</code> is an exact invariant of motion. Using 4th-order
          Runge-Kutta with Δt = 2 ms, kinetic and potential energy exchange continuously while total energy{' '}
          <code style={{ color: '#eef4ff' }}>E(t)</code> remains flat (current relative drift:{' '}
          <strong>{relErrorPct.toFixed(5)}%</strong>).
        </span>
      </div>

      <div className="grid-2">
        <ScientificChart
          title="Mechanical Energy vs Time"
          subtitle="Real-time exchange between Kinetic T(t) and Potential V(t) with flat Total E(t)"
          xLabel="Time t (s)"
          yLabel="Energy (J)"
          datasets={energyDatasets}
          tall
          exportName="energy_vs_time.png"
        />

        <ScientificChart
          title="Numerical Energy Conservation Residual ΔE(t)"
          subtitle="Deviation E(t) − E₀ from exact initial Hamiltonian"
          xLabel="Time t (s)"
          yLabel="ΔE(t) [J]"
          datasets={driftDatasets}
          tall
          exportName="energy_conservation_residual.png"
        />
      </div>
    </div>
  );
}
