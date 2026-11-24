import React, { useMemo, useState } from 'react';
import { GitCompare, AlertTriangle } from 'lucide-react';
import { PendulumCanvas } from './PendulumCanvas';
import { ScientificChart } from './ScientificChart';
import { computeSeparation } from '../physics/doublePendulum';

export function ChaosAnalysisSection({
  stateA,
  stateB,
  params,
  trailA,
  trailB,
  compareMode,
  perturbation,
  simTime,
  history,
  lyapunovEst,
  onCompareInitialConditions,
}) {
  const [logScale, setLogScale] = useState(true);

  const liveSep = useMemo(() => {
    if (!stateB) return { angularSeparation: 0, wrappedAngularSeparation: 0, phaseSpaceDistance: 0 };
    return computeSeparation(stateA, stateB);
  }, [stateA, stateB]);

  const trajectoryCompareDatasets = useMemo(() => {
    const theta2A = history.map((p) => ({ x: p.t, y: p.theta2 }));
    const theta2B = history
      .filter((p) => p.stateB)
      .map((p) => ({ x: p.t, y: p.stateB.theta2 }));
    return [
      { label: 'θ₂(t) Primary (A)', data: theta2A, color: '#00e5ff' },
      { label: 'θ₂(t) Perturbed (B)', data: theta2B, color: '#f59e0b', borderDash: [5, 3] },
    ];
  }, [history]);

  const separationDatasets = useMemo(() => {
    const pts = history.map((p) => {
      const val = Math.max(p.angularSeparation ?? perturbation, 1e-9);
      return {
        x: p.t,
        y: logScale ? Math.log(val / perturbation) : val,
      };
    });
    return [
      {
        label: logScale ? 'ln(Δθ(t) / δ₀)' : 'Angular Separation Δθ(t) [rad]',
        data: pts,
        color: '#f43f5e',
        bgColor: 'rgba(244, 63, 94, 0.14)',
        fill: true,
      },
    ];
  }, [history, logScale, perturbation]);

  const lyapunovDatasets = useMemo(() => {
    const pts = history.map((p) => ({ x: p.t, y: p.lyapunov ?? 0 }));
    return [
      {
        label: 'Finite-Time Lyapunov Estimate λ(t) [s⁻¹]',
        data: pts,
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.16)',
        fill: true,
      },
    ];
  }, [history]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Action Header */}
      <div className="sci-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h3 className="sci-card-title">
              <GitCompare size={17} color="#c084fc" /> Sensitivity to Initial Conditions &amp; Lyapunov Divergence
            </h3>
            <p className="sci-card-subtitle">
              Comparing Pendulum A (θ₁₀) against Pendulum B (θ₁₀ + δ₀), where δ₀ = {perturbation.toExponential(0)} rad
            </p>
          </div>
          <button
            type="button"
            className={`btn btn-purple ${compareMode ? 'active-toggle' : ''}`}
            onClick={onCompareInitialConditions}
          >
            <GitCompare size={15} />
            {compareMode ? 'Restart Twin Comparison' : 'Compare Initial Conditions'}
          </button>
        </div>

        <div className="grid-4" style={{ marginTop: '14px' }}>
          <div className="stat-tile">
            <div className="stat-tile-label">Initial Perturbation δ₀</div>
            <div className="stat-tile-value" style={{ color: '#00e5ff' }}>
              {perturbation.toExponential(1)} rad
            </div>
            <div className="stat-tile-note">{(perturbation * (180 / Math.PI)).toFixed(5)}° difference</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Angular Separation Δθ(t)</div>
            <div className="stat-tile-value" style={{ color: '#f43f5e' }}>
              {compareMode ? liveSep.angularSeparation.toFixed(4) : '—'} rad
            </div>
            <div className="stat-tile-note">Euclidean √(Δθ₁² + Δθ₂²)</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Amplification Factor</div>
            <div className="stat-tile-value" style={{ color: '#fbbf24' }}>
              {compareMode ? `${(liveSep.angularSeparation / perturbation).toExponential(2)}×` : '—'}
            </div>
            <div className="stat-tile-note">Relative to initial δ₀</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Approx. Lyapunov λ_max</div>
            <div className="stat-tile-value" style={{ color: '#c084fc' }}>
              {lyapunovEst.toFixed(3)} s⁻¹
            </div>
            <div className="stat-tile-note">
              {lyapunovEst > 0.25 ? 'Positive → Chaotic divergence' : 'Near zero → Bounded / Regular'}
            </div>
          </div>
        </div>
      </div>

      {!compareMode && (
        <div className="callout-banner amber" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span>
            Twin comparison overlay is currently paused/disabled. Click <strong>Compare Initial Conditions</strong>{' '}
            above to launch two synchronized simulations differing only by δ₀ = {perturbation.toExponential(0)} rad.
          </span>
        </div>
      )}

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
          title="Twin Pendulum Divergence (A vs B)"
        />
        <ScientificChart
          title="Initial-Condition Comparison: θ₂(t)"
          subtitle="Trajectory A (Cyan) vs Perturbed Trajectory B (Amber)"
          xLabel="Time t (s)"
          yLabel="Outer Angle θ₂ (rad)"
          datasets={trajectoryCompareDatasets}
          exportName="initial_condition_comparison.png"
        />
      </div>

      <div className="grid-2">
        <ScientificChart
          title="Angular Separation vs Time"
          subtitle={
            logScale
              ? 'Logarithmic growth ln(Δθ(t)/δ₀) — linear slope approximates λ_max before saturation'
              : 'Direct Euclidean angular separation Δθ(t) between trajectories A and B'
          }
          xLabel="Time t (s)"
          yLabel={logScale ? 'ln(Δθ(t) / δ₀)' : 'Δθ(t) [rad]'}
          datasets={separationDatasets}
          exportName="angular_separation_vs_time.png"
          headerExtra={
            <button
              type="button"
              className={`btn btn-chip ${logScale ? 'active' : ''}`}
              onClick={() => setLogScale((v) => !v)}
            >
              {logScale ? 'Log Growth ln(Δθ/δ₀)' : 'Linear Δθ(t)'}
            </button>
          }
        />

        <ScientificChart
          title="Approximate Lyapunov Exponent Convergence"
          subtitle="Benettin finite-time renormalization estimate λ(t)"
          xLabel="Time t (s)"
          yLabel="λ(t) [s⁻¹]"
          datasets={lyapunovDatasets}
          exportName="lyapunov_exponent_convergence.png"
        />
      </div>

      <div className="callout-banner">
        <strong>Methodological Note on Lyapunov Estimation:</strong> Numerical Lyapunov exponent estimates are{' '}
        <em>approximate</em> and depend on simulation duration <code style={{ color: '#e2e8f0' }}>t</code>, perturbation
        size <code style={{ color: '#e2e8f0' }}>δ₀</code>, and the phase-space norm. Direct twin-trajectory separation
        saturates once <code style={{ color: '#e2e8f0' }}>Δθ ~ π</code>, whereas the Benettin renormalization tracker
        rescales a shadow perturbation vector (<code style={{ color: '#e2e8f0' }}>ε = 10⁻⁶</code>) every 0.2 s using a
        characteristic frequency scale <code style={{ color: '#e2e8f0' }}>ω_c = √(g / min(L₁, L₂))</code>. In regular
        regimes, finite-time <code style={{ color: '#e2e8f0' }}>λ(t)</code> decays slowly toward zero as{' '}
        <code style={{ color: '#e2e8f0' }}>O(ln t / t)</code>.
      </div>
    </div>
  );
}
