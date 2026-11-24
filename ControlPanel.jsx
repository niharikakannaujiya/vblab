import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Eraser,
  GitCompare,
  Download,
  Sliders,
} from 'lucide-react';
import { PRESETS } from '../physics/doublePendulum';

function SliderField({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="slider-row">
      <div className="slider-header">
        <span>{label}</span>
        <span className="slider-value">
          {Number(value).toFixed(step < 0.05 ? 2 : 1)} {unit}
        </span>
      </div>
      <div className="slider-inputs">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (Number.isFinite(parsed)) onChange(parsed);
          }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number(value).toFixed(step < 0.05 ? 2 : 1)}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (Number.isFinite(parsed)) {
              onChange(Math.min(max, Math.max(min, parsed)));
            }
          }}
        />
      </div>
    </div>
  );
}

export function ControlPanel({
  isRunning,
  onToggleRun,
  onReset,
  onStep,
  onClearTrail,
  onCompareInitialConditions,
  onExportCsv,
  compareMode,
  activePreset,
  onSelectPreset,
  params,
  onUpdateParam,
  initialState,
  onUpdateInitial,
  simSpeed,
  onChangeSimSpeed,
  trailLength,
  onChangeTrailLength,
  perturbation,
  onChangePerturbation,
  liveState,
  liveEnergy,
  initialEnergy,
  simTime,
  lyapunovEst,
}) {
  const radToDeg = (r) => (r * 180) / Math.PI;
  const degToRad = (d) => (d * Math.PI) / 180;
  const energyDriftPct =
    initialEnergy > 1e-9
      ? ((Math.abs(liveEnergy.total - initialEnergy) / initialEnergy) * 100).toFixed(5)
      : '0.00000';

  return (
    <aside className="sci-card" aria-label="Simulation Control Panel">
      <div className="sci-card-header" style={{ marginBottom: '10px' }}>
        <h2 className="sci-card-title">
          <Sliders size={16} color="#00e5ff" /> Simulation Controls
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.73rem',
            color: isRunning ? '#34d399' : '#94a3b8',
          }}
        >
          {isRunning ? '● RUNNING' : '❚❚ PAUSED'}
        </span>
      </div>

      {/* Primary Transport Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <button type="button" className="btn btn-primary" onClick={onToggleRun}>
          {isRunning ? <Pause size={15} /> : <Play size={15} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button type="button" className="btn" onClick={onReset}>
          <RotateCcw size={15} /> Reset
        </button>
        <button type="button" className="btn" onClick={onStep} disabled={isRunning}>
          <StepForward size={15} /> Step (20 ms)
        </button>
        <button type="button" className="btn" onClick={onClearTrail}>
          <Eraser size={15} /> Clear Trail
        </button>
      </div>

      {/* Chaos Compare & CSV Export */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '8px' }}>
        <button
          type="button"
          className={`btn btn-purple ${compareMode ? 'active-toggle' : ''}`}
          onClick={onCompareInitialConditions}
        >
          <GitCompare size={15} />
          {compareMode ? 'Comparing Initial Conditions (Active)' : 'Compare Initial Conditions'}
        </button>
        <button type="button" className="btn" onClick={onExportCsv}>
          <Download size={15} /> Export Simulation CSV
        </button>
      </div>

      {/* Presets */}
      <div className="control-section">
        <div className="control-section-label">
          <span>Regime Presets</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {Object.values(PRESETS).map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`btn btn-chip ${activePreset === preset.id ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset.id)}
              title={preset.description}
              style={{ padding: '6px 4px', fontSize: '0.73rem' }}
            >
              {preset.name.replace(' Motion', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Playback & Visualization Tuning */}
      <div className="control-section">
        <div className="control-section-label">
          <span>Playback &amp; Trail</span>
        </div>
        <SliderField
          label="Simulation Speed"
          value={simSpeed}
          min={0.1}
          max={3.0}
          step={0.1}
          unit="×"
          onChange={onChangeSimSpeed}
        />
        <SliderField
          label="Trail Length"
          value={trailLength}
          min={0}
          max={1200}
          step={50}
          unit="pts"
          onChange={onChangeTrailLength}
        />
        <div className="slider-row">
          <div className="slider-header">
            <span>Twin Perturbation (δ₀)</span>
            <span className="slider-value">{perturbation.toExponential(0)} rad</span>
          </div>
          <select
            value={perturbation}
            onChange={(e) => onChangePerturbation(parseFloat(e.target.value))}
          >
            <option value={1e-2}>0.01 rad (Fast visible divergence)</option>
            <option value={1e-3}>0.001 rad (10⁻³ rad)</option>
            <option value={1e-4}>0.0001 rad (10⁻⁴ rad — default)</option>
            <option value={1e-5}>0.00001 rad (10⁻⁵ rad)</option>
          </select>
        </div>
      </div>

      {/* Physical Parameters */}
      <div className="control-section">
        <div className="control-section-label">
          <span>Physical Parameters</span>
        </div>
        <SliderField
          label="Mass 1 (m₁)"
          value={params.m1}
          min={0.2}
          max={5.0}
          step={0.1}
          unit="kg"
          onChange={(v) => onUpdateParam('m1', v)}
        />
        <SliderField
          label="Mass 2 (m₂)"
          value={params.m2}
          min={0.2}
          max={5.0}
          step={0.1}
          unit="kg"
          onChange={(v) => onUpdateParam('m2', v)}
        />
        <SliderField
          label="Rod Length 1 (L₁)"
          value={params.L1}
          min={0.3}
          max={2.5}
          step={0.05}
          unit="m"
          onChange={(v) => onUpdateParam('L1', v)}
        />
        <SliderField
          label="Rod Length 2 (L₂)"
          value={params.L2}
          min={0.3}
          max={2.5}
          step={0.05}
          unit="m"
          onChange={(v) => onUpdateParam('L2', v)}
        />
        <SliderField
          label="Gravity (g)"
          value={params.g}
          min={1.0}
          max={25.0}
          step={0.1}
          unit="m/s²"
          onChange={(v) => onUpdateParam('g', v)}
        />
      </div>

      {/* Initial Conditions */}
      <div className="control-section">
        <div className="control-section-label">
          <span>Initial State (Applies on Reset)</span>
        </div>
        <SliderField
          label="Initial θ₁"
          value={radToDeg(initialState.theta1)}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(deg) => onUpdateInitial('theta1', degToRad(deg))}
        />
        <SliderField
          label="Initial θ₂"
          value={radToDeg(initialState.theta2)}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(deg) => onUpdateInitial('theta2', degToRad(deg))}
        />
        <SliderField
          label="Initial ω₁"
          value={initialState.omega1}
          min={-10}
          max={10}
          step={0.1}
          unit="rad/s"
          onChange={(v) => onUpdateInitial('omega1', v)}
        />
        <SliderField
          label="Initial ω₂"
          value={initialState.omega2}
          min={-10}
          max={10}
          step={0.1}
          unit="rad/s"
          onChange={(v) => onUpdateInitial('omega2', v)}
        />
      </div>

      {/* Live State Readout */}
      <div className="control-section">
        <div className="control-section-label">
          <span>Live Telemetry</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>t = {simTime.toFixed(2)}s</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
          }}
        >
          <div className="stat-tile" style={{ padding: '8px 10px' }}>
            <div className="stat-tile-label" style={{ fontSize: '0.66rem' }}>θ₁ (rad / °)</div>
            <div style={{ color: '#00e5ff' }}>
              {liveState.theta1.toFixed(3)} / {radToDeg(liveState.theta1).toFixed(1)}°
            </div>
          </div>
          <div className="stat-tile" style={{ padding: '8px 10px' }}>
            <div className="stat-tile-label" style={{ fontSize: '0.66rem' }}>θ₂ (rad / °)</div>
            <div style={{ color: '#c084fc' }}>
              {liveState.theta2.toFixed(3)} / {radToDeg(liveState.theta2).toFixed(1)}°
            </div>
          </div>
          <div className="stat-tile" style={{ padding: '8px 10px' }}>
            <div className="stat-tile-label" style={{ fontSize: '0.66rem' }}>ω₁ (rad/s)</div>
            <div>{liveState.omega1.toFixed(3)}</div>
          </div>
          <div className="stat-tile" style={{ padding: '8px 10px' }}>
            <div className="stat-tile-label" style={{ fontSize: '0.66rem' }}>ω₂ (rad/s)</div>
            <div>{liveState.omega2.toFixed(3)}</div>
          </div>
          <div className="stat-tile" style={{ padding: '8px 10px' }}>
            <div className="stat-tile-label" style={{ fontSize: '0.66rem' }}>Total E / Drift</div>
            <div style={{ color: '#34d399' }}>
              {liveEnergy.total.toFixed(3)} J ({energyDriftPct}%)
            </div>
          </div>
          <div className="stat-tile" style={{ padding: '8px 10px' }}>
            <div className="stat-tile-label" style={{ fontSize: '0.66rem' }}>FTLE λ_max</div>
            <div style={{ color: '#fbbf24' }}>{lyapunovEst.toFixed(3)} s⁻¹</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
