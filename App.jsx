import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Atom,
  BatteryCharging,
  BookOpen,
  Compass,
  FileText,
  GitCompare,
  LayoutDashboard,
} from 'lucide-react';
import {
  PRESETS,
  computeEnergy,
  computeKinematics,
  computeSeparation,
  createLyapunovTracker,
  rk4Step,
  stepLyapunovTracker,
} from './physics/doublePendulum';
import { buildSimulationCsv, downloadCsvFile } from './utils/exportData';
import { ControlPanel } from './components/ControlPanel';
import { OverviewSection } from './components/OverviewSection';
import { LiveSimulationSection } from './components/LiveSimulationSection';
import { PhaseSpaceSection } from './components/PhaseSpaceSection';
import { ChaosAnalysisSection } from './components/ChaosAnalysisSection';
import { EnergyAnalysisSection } from './components/EnergyAnalysisSection';
import { TheorySection } from './components/TheorySection';
import { AboutSection } from './components/AboutSection';

const FIXED_DT = 0.002; // 2 ms RK4 substep
const SAMPLE_INTERVAL = 0.02; // 50 Hz telemetry/chart sampling
const MAX_HISTORY_POINTS = 3000;
const MAX_EXPORT_POINTS = 20000;

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'simulation', label: 'Live Simulation', icon: Activity },
  { id: 'phase-space', label: 'Phase Space', icon: Compass },
  { id: 'chaos', label: 'Chaos Analysis', icon: GitCompare },
  { id: 'energy', label: 'Energy Analysis', icon: BatteryCharging },
  { id: 'theory', label: 'Theory & Equations', icon: FileText },
  { id: 'about', label: 'About Project', icon: BookOpen },
];

function createSamplePoint(t, stateA, stateB, params, lyapunov, compareMode) {
  const energy = computeEnergy(stateA, params);
  const kin = computeKinematics(stateA, params);
  const sep = compareMode && stateB ? computeSeparation(stateA, stateB) : null;
  return {
    t,
    theta1: stateA.theta1,
    theta2: stateA.theta2,
    omega1: stateA.omega1,
    omega2: stateA.omega2,
    kinetic: energy.kinetic,
    potential: energy.potential,
    total: energy.total,
    x1: kin.x1,
    y1: kin.y1,
    x2: kin.x2,
    y2: kin.y2,
    stateB: compareMode && stateB ? { ...stateB } : null,
    angularSeparation: sep ? sep.angularSeparation : 0,
    lyapunov,
  };
}

export default function App() {
  const defaultPreset = PRESETS.chaotic;

  const [activeTab, setActiveTab] = useState('overview');
  const [activePreset, setActivePreset] = useState(defaultPreset.id);
  const [isRunning, setIsRunning] = useState(true);
  const [compareMode, setCompareMode] = useState(false);

  const [params, setParams] = useState({ ...defaultPreset.params });
  const [initialState, setInitialState] = useState({ ...defaultPreset.initialState });
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [trailLength, setTrailLength] = useState(450);
  const [perturbation, setPerturbation] = useState(1e-4);

  // Render-synced state snapshots
  const [renderSnapshot, setRenderSnapshot] = useState(() => {
    const e0 = computeEnergy(defaultPreset.initialState, defaultPreset.params);
    const pt0 = createSamplePoint(
      0,
      defaultPreset.initialState,
      null,
      defaultPreset.params,
      0,
      false
    );
    return {
      stateA: { ...defaultPreset.initialState },
      stateB: null,
      simTime: 0,
      liveEnergy: e0,
      initialEnergy: e0.total,
      lyapunovEst: 0,
      trailA: [{ x: pt0.x2, y: pt0.y2 }],
      trailB: [],
      history: [pt0],
    };
  });

  // High-frequency mutable simulation engine ref
  const simRef = useRef({
    stateA: { ...defaultPreset.initialState },
    stateB: { ...defaultPreset.initialState, theta1: defaultPreset.initialState.theta1 + 1e-4 },
    tracker: createLyapunovTracker(defaultPreset.initialState, 1e-6, 0.2),
    simTime: 0,
    accumulator: 0,
    sampleAccumulator: 0,
    initialEnergy: computeEnergy(defaultPreset.initialState, defaultPreset.params).total,
    trailA: [],
    trailB: [],
    history: [],
    exportHistory: [],
  });

  // Keep live settings accessible inside RAF loop without tearing down RAF
  const settingsRef = useRef({
    params,
    simSpeed,
    trailLength,
    compareMode,
    perturbation,
  });
  settingsRef.current = { params, simSpeed, trailLength, compareMode, perturbation };

  // Initialize simRef initial sample once
  useEffect(() => {
    const pt0 = createSamplePoint(0, simRef.current.stateA, null, params, 0, false);
    simRef.current.trailA = [{ x: pt0.x2, y: pt0.y2 }];
    simRef.current.history = [pt0];
    simRef.current.exportHistory = [pt0];
  }, []);

  const syncSnapshotToReact = useCallback(() => {
    const s = simRef.current;
    const { params: curParams, compareMode: curCompare } = settingsRef.current;
    setRenderSnapshot({
      stateA: { ...s.stateA },
      stateB: curCompare ? { ...s.stateB } : null,
      simTime: s.simTime,
      liveEnergy: computeEnergy(s.stateA, curParams),
      initialEnergy: s.initialEnergy,
      lyapunovEst: s.tracker.currentEstimate,
      trailA: [...s.trailA],
      trailB: curCompare ? [...s.trailB] : [],
      history: [...s.history],
    });
  }, []);

  const resetSimulation = useCallback(
    (nextInit = initialState, nextParams = params, nextCompare = compareMode, nextPerturb = perturbation, autoRun = isRunning) => {
      const stateA = { ...nextInit };
      const stateB = { ...nextInit, theta1: nextInit.theta1 + nextPerturb };
      const tracker = createLyapunovTracker(stateA, 1e-6, 0.2);
      const e0 = computeEnergy(stateA, nextParams).total;
      const pt0 = createSamplePoint(0, stateA, stateB, nextParams, 0, nextCompare);

      simRef.current = {
        stateA,
        stateB,
        tracker,
        simTime: 0,
        accumulator: 0,
        sampleAccumulator: 0,
        initialEnergy: e0,
        trailA: [{ x: pt0.x2, y: pt0.y2 }],
        trailB: nextCompare ? [{ x: computeKinematics(stateB, nextParams).x2, y: computeKinematics(stateB, nextParams).y2 }] : [],
        history: [pt0],
        exportHistory: [pt0],
      };

      setCompareMode(nextCompare);
      setIsRunning(autoRun);
      setRenderSnapshot({
        stateA,
        stateB: nextCompare ? stateB : null,
        simTime: 0,
        liveEnergy: computeEnergy(stateA, nextParams),
        initialEnergy: e0,
        lyapunovEst: 0,
        trailA: [...simRef.current.trailA],
        trailB: [...simRef.current.trailB],
        history: [pt0],
      });
    },
    [initialState, params, compareMode, perturbation, isRunning]
  );

  const advanceByDuration = useCallback((durationSec) => {
    const s = simRef.current;
    const { params: curParams, trailLength: maxTrail, compareMode: curCompare } = settingsRef.current;

    s.accumulator += durationSec;
    while (s.accumulator >= FIXED_DT) {
      s.stateA = rk4Step(s.stateA, curParams, FIXED_DT);
      if (curCompare) {
        s.stateB = rk4Step(s.stateB, curParams, FIXED_DT);
      }
      stepLyapunovTracker(s.tracker, s.stateA, curParams, FIXED_DT);

      s.simTime += FIXED_DT;
      s.accumulator -= FIXED_DT;
      s.sampleAccumulator += FIXED_DT;

      if (s.sampleAccumulator >= SAMPLE_INTERVAL) {
        s.sampleAccumulator -= SAMPLE_INTERVAL;
        const pt = createSamplePoint(
          s.simTime,
          s.stateA,
          s.stateB,
          curParams,
          s.tracker.currentEstimate,
          curCompare
        );

        s.history.push(pt);
        if (s.history.length > MAX_HISTORY_POINTS) {
          s.history.shift();
        }
        s.exportHistory.push(pt);
        if (s.exportHistory.length > MAX_EXPORT_POINTS) {
          s.exportHistory.shift();
        }

        if (maxTrail > 0) {
          s.trailA.push({ x: pt.x2, y: pt.y2 });
          while (s.trailA.length > maxTrail) s.trailA.shift();

          if (curCompare) {
            const kinB = computeKinematics(s.stateB, curParams);
            s.trailB.push({ x: kinB.x2, y: kinB.y2 });
            while (s.trailB.length > maxTrail) s.trailB.shift();
          }
        } else {
          s.trailA = [];
          s.trailB = [];
        }
      }
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isRunning) return undefined;

    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now) => {
      const wallDt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      advanceByDuration(wallDt * settingsRef.current.simSpeed);
      syncSnapshotToReact();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, advanceByDuration, syncSnapshotToReact]);

  const handleToggleRun = () => setIsRunning((r) => !r);

  const handleReset = () => {
    resetSimulation(initialState, params, compareMode, perturbation, false);
  };

  const handleStep = () => {
    if (isRunning) return;
    advanceByDuration(0.02);
    syncSnapshotToReact();
  };

  const handleClearTrail = () => {
    simRef.current.trailA = [];
    simRef.current.trailB = [];
    syncSnapshotToReact();
  };

  const handleCompareInitialConditions = () => {
    resetSimulation(initialState, params, true, perturbation, true);
  };

  const handleSelectPreset = (presetId) => {
    const preset = PRESETS[presetId];
    if (!preset) return;
    setActivePreset(presetId);
    const nextParams = { ...preset.params };
    const nextInit = { ...preset.initialState };
    setParams(nextParams);
    setInitialState(nextInit);
    resetSimulation(nextInit, nextParams, compareMode, perturbation, true);
  };

  const handleUpdateParam = (key, val) => {
    const nextParams = { ...params, [key]: val };
    setParams(nextParams);
    // Re-baseline initialEnergy when physical parameters change so conservation drift measures RK4 accuracy cleanly
    simRef.current.initialEnergy = computeEnergy(simRef.current.stateA, nextParams).total;
    setActivePreset('custom');
    syncSnapshotToReact();
  };

  const handleUpdateInitial = (key, val) => {
    const nextInit = { ...initialState, [key]: val };
    setInitialState(nextInit);
    setActivePreset('custom');
    if (simRef.current.simTime === 0 && !isRunning) {
      resetSimulation(nextInit, params, compareMode, perturbation, false);
    }
  };

  const handleChangePerturbation = (newEps) => {
    setPerturbation(newEps);
    if (compareMode) {
      resetSimulation(initialState, params, true, newEps, isRunning);
    }
  };

  const handleExportCsv = () => {
    const csv = buildSimulationCsv(simRef.current.exportHistory, params);
    downloadCsvFile(csv, `double_pendulum_${activePreset}_${Date.now()}.csv`);
  };

  const showSidebarControls = activeTab !== 'theory' && activeTab !== 'about';

  return (
    <div className="app-shell">
      {/* Top Scientific Header */}
      <header className="top-header">
        <div className="brand-block">
          <div className="brand-icon">
            <Atom size={25} />
          </div>
          <div>
            <h1 className="brand-title">Phase Space Trajectory Analysis of a Chaotic Double Pendulum</h1>
            <p className="brand-subtitle">
              Lagrangian Mechanics &bull; 4th-Order Runge-Kutta Integrator &bull; Chaos &amp; Energy Telemetry
            </p>
          </div>
        </div>

        <div className="header-telemetry">
          <div className="telemetry-pill">
            <span className="telemetry-pill-label">Sim Time</span>
            <span className="telemetry-pill-value">{renderSnapshot.simTime.toFixed(2)} s</span>
          </div>
          <div className="telemetry-pill">
            <span className="telemetry-pill-label">Angles (θ₁, θ₂)</span>
            <span className="telemetry-pill-value purple">
              {(renderSnapshot.stateA.theta1 * (180 / Math.PI)).toFixed(0)}°,{' '}
              {(renderSnapshot.stateA.theta2 * (180 / Math.PI)).toFixed(0)}°
            </span>
          </div>
          <div className="telemetry-pill">
            <span className="telemetry-pill-label">Total Energy</span>
            <span className="telemetry-pill-value emerald">
              {renderSnapshot.liveEnergy.total.toFixed(2)} J
            </span>
          </div>
          <div className="telemetry-pill">
            <span className="telemetry-pill-label">FTLE λ_max</span>
            <span className="telemetry-pill-value amber">
              {renderSnapshot.lyapunovEst.toFixed(3)} s⁻¹
            </span>
          </div>
        </div>
      </header>

      {/* Section Navigation */}
      <nav className="nav-tabs" aria-label="Dashboard Sections">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className={`workspace-grid ${showSidebarControls ? '' : 'full-width'}`}>
        {showSidebarControls && (
          <ControlPanel
            isRunning={isRunning}
            onToggleRun={handleToggleRun}
            onReset={handleReset}
            onStep={handleStep}
            onClearTrail={handleClearTrail}
            onCompareInitialConditions={handleCompareInitialConditions}
            onExportCsv={handleExportCsv}
            compareMode={compareMode}
            activePreset={activePreset}
            onSelectPreset={handleSelectPreset}
            params={params}
            onUpdateParam={handleUpdateParam}
            initialState={initialState}
            onUpdateInitial={handleUpdateInitial}
            simSpeed={simSpeed}
            onChangeSimSpeed={setSimSpeed}
            trailLength={trailLength}
            onChangeTrailLength={setTrailLength}
            perturbation={perturbation}
            onChangePerturbation={handleChangePerturbation}
            liveState={renderSnapshot.stateA}
            liveEnergy={renderSnapshot.liveEnergy}
            initialEnergy={renderSnapshot.initialEnergy}
            simTime={renderSnapshot.simTime}
            lyapunovEst={renderSnapshot.lyapunovEst}
          />
        )}

        <section style={{ minWidth: 0 }}>
          {activeTab === 'overview' && (
            <OverviewSection
              stateA={renderSnapshot.stateA}
              stateB={renderSnapshot.stateB}
              params={params}
              trailA={renderSnapshot.trailA}
              trailB={renderSnapshot.trailB}
              compareMode={compareMode}
              simTime={renderSnapshot.simTime}
              liveEnergy={renderSnapshot.liveEnergy}
              initialEnergy={renderSnapshot.initialEnergy}
              lyapunovEst={renderSnapshot.lyapunovEst}
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
              onNavigateTab={setActiveTab}
              onCompareInitialConditions={handleCompareInitialConditions}
            />
          )}

          {activeTab === 'simulation' && (
            <LiveSimulationSection
              stateA={renderSnapshot.stateA}
              stateB={renderSnapshot.stateB}
              params={params}
              trailA={renderSnapshot.trailA}
              trailB={renderSnapshot.trailB}
              compareMode={compareMode}
              simTime={renderSnapshot.simTime}
              history={renderSnapshot.history}
            />
          )}

          {activeTab === 'phase-space' && (
            <PhaseSpaceSection
              stateA={renderSnapshot.stateA}
              stateB={renderSnapshot.stateB}
              params={params}
              trailA={renderSnapshot.trailA}
              trailB={renderSnapshot.trailB}
              compareMode={compareMode}
              simTime={renderSnapshot.simTime}
              history={renderSnapshot.history}
            />
          )}

          {activeTab === 'chaos' && (
            <ChaosAnalysisSection
              stateA={renderSnapshot.stateA}
              stateB={renderSnapshot.stateB}
              params={params}
              trailA={renderSnapshot.trailA}
              trailB={renderSnapshot.trailB}
              compareMode={compareMode}
              perturbation={perturbation}
              simTime={renderSnapshot.simTime}
              history={renderSnapshot.history}
              lyapunovEst={renderSnapshot.lyapunovEst}
              onCompareInitialConditions={handleCompareInitialConditions}
            />
          )}

          {activeTab === 'energy' && (
            <EnergyAnalysisSection
              history={renderSnapshot.history}
              liveEnergy={renderSnapshot.liveEnergy}
              initialEnergy={renderSnapshot.initialEnergy}
            />
          )}

          {activeTab === 'theory' && <TheorySection />}
          {activeTab === 'about' && <AboutSection />}
        </section>
      </main>
    </div>
  );
}
