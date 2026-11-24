import React from 'react';
import {
  Activity,
  Compass,
  Flame,
  Zap,
  ArrowRight,
  GitCompare,
  Sparkles,
} from 'lucide-react';
import { PRESETS } from '../physics/doublePendulum';
import { PendulumCanvas } from './PendulumCanvas';

export function OverviewSection({
  stateA,
  stateB,
  params,
  trailA,
  trailB,
  compareMode,
  simTime,
  liveEnergy,
  initialEnergy,
  lyapunovEst,
  activePreset,
  onSelectPreset,
  onNavigateTab,
  onCompareInitialConditions,
}) {
  const driftPct =
    initialEnergy > 1e-9
      ? ((Math.abs(liveEnergy.total - initialEnergy) / initialEnergy) * 100).toFixed(5)
      : '0.00000';

  const regimeLabel =
    lyapunovEst > 0.35 ? 'Strongly Chaotic' : lyapunovEst > 0.12 ? 'Weakly Chaotic / Transitional' : 'Quasi-Periodic / Regular';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Hero Banner */}
      <div className="sci-card" style={{ background: 'linear-gradient(135deg, rgba(11, 18, 38, 0.92), rgba(20, 14, 44, 0.88))' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '18px', alignItems: 'center' }}>
          <div style={{ maxWidth: '760px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#00e5ff',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              <Sparkles size={14} /> Nonlinear Hamiltonian Dynamics &bull; 4D Phase Space Explorer
            </div>
            <h2
              style={{
                margin: '0 0 10px',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.35rem, 2.4vw, 1.9rem)',
                lineHeight: 1.2,
              }}
            >
              Phase Space Trajectory Analysis of a Chaotic Double Pendulum
            </h2>
            <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '0.93rem' }}>
              A planar double pendulum is a classic two-degree-of-freedom conservative system governed by coupled
              nonlinear Euler-Lagrange differential equations. Despite being completely deterministic and energy-conserving,
              above a critical energy threshold its trajectories in 4D phase space{' '}
              <code style={{ color: '#67e8f9' }}>(θ₁, θ₂, ω₁, ω₂)</code> exhibit extreme sensitivity to initial
              conditions—diverging exponentially at a rate quantified by the maximum Lyapunov exponent.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button type="button" className="btn btn-primary" onClick={() => onNavigateTab('phase-space')}>
                <Compass size={15} /> Explore Phase Space <ArrowRight size={14} />
              </button>
              <button type="button" className="btn btn-purple" onClick={() => { onCompareInitialConditions(); onNavigateTab('chaos'); }}>
                <GitCompare size={15} /> Compare Initial Conditions
              </button>
              <button type="button" className="btn" onClick={() => onNavigateTab('simulation')}>
                <Activity size={15} /> Full Live Simulation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid-4">
        <div className="stat-tile">
          <div className="stat-tile-label">Dynamical Regime</div>
          <div className="stat-tile-value" style={{ color: '#00e5ff', fontSize: '1.08rem' }}>
            {regimeLabel}
          </div>
          <div className="stat-tile-note">Preset: {PRESETS[activePreset]?.name ?? 'Custom State'}</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">Est. Lyapunov (λ_max)</div>
          <div className="stat-tile-value" style={{ color: '#c084fc' }}>
            {lyapunovEst.toFixed(3)} s⁻¹
          </div>
          <div className="stat-tile-note">Benettin finite-time renormalization</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">Total Mechanical Energy</div>
          <div className="stat-tile-value" style={{ color: '#34d399' }}>
            {liveEnergy.total.toFixed(3)} J
          </div>
          <div className="stat-tile-note">Relative RK4 drift: {driftPct}%</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">Phase Coordinates</div>
          <div className="stat-tile-value" style={{ color: '#fbbf24', fontSize: '1.02rem' }}>
            ({stateA.theta1.toFixed(2)}, {stateA.theta2.toFixed(2)}) rad
          </div>
          <div className="stat-tile-note">
            ω = ({stateA.omega1.toFixed(2)}, {stateA.omega2.toFixed(2)}) rad/s
          </div>
        </div>
      </div>

      {/* Live Preview + Scientific Observations */}
      <div className="grid-2">
        <PendulumCanvas
          stateA={stateA}
          stateB={stateB}
          params={params}
          trailA={trailA}
          trailB={trailB}
          compareMode={compareMode}
          simTime={simTime}
          compact
          title="Live Apparatus Preview"
        />

        <div className="sci-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div className="sci-card-header">
              <h3 className="sci-card-title">
                <Flame size={16} color="#a855f7" /> Quick Regime Experiments
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.values(PRESETS).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className="stat-tile"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderColor: activePreset === preset.id ? 'rgba(0, 229, 255, 0.55)' : 'rgba(59, 130, 246, 0.2)',
                    background: activePreset === preset.id ? 'rgba(0, 229, 255, 0.08)' : 'rgba(8, 13, 29, 0.72)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#eef4ff', fontSize: '0.92rem' }}>{preset.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#00e5ff' }}>
                      {preset.subtitle}
                    </span>
                  </div>
                  <div className="stat-tile-note" style={{ marginTop: '5px' }}>{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="callout-banner cyan">
            <strong>Scientific Observation:</strong> In the <em>Regular Motion</em> preset, the trajectory traces closed
            or quasi-periodic invariant tori in phase space and twin pendulums remain synchronized. Switching to{' '}
            <em>Chaotic Motion</em> breaks invariant tori, causing the phase-space portrait to fill a tangled region
            while a 10⁻⁴ rad perturbation grows exponentially within seconds.
          </div>
        </div>
      </div>
    </div>
  );
}
