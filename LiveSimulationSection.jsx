import React, { useMemo } from 'react';
import { PendulumCanvas } from './PendulumCanvas';
import { ScientificChart } from './ScientificChart';

export function LiveSimulationSection({
  stateA,
  stateB,
  params,
  trailA,
  trailB,
  compareMode,
  simTime,
  history,
}) {
  const angleDatasets = useMemo(() => {
    const t1 = history.map((p) => ({ x: p.t, y: p.theta1 }));
    const t2 = history.map((p) => ({ x: p.t, y: p.theta2 }));
    return [
      { label: 'θ₁(t) [rad]', data: t1, color: '#00e5ff', bgColor: 'rgba(0, 229, 255, 0.15)' },
      { label: 'θ₂(t) [rad]', data: t2, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)' },
    ];
  }, [history]);

  const velocityDatasets = useMemo(() => {
    const w1 = history.map((p) => ({ x: p.t, y: p.omega1 }));
    const w2 = history.map((p) => ({ x: p.t, y: p.omega2 }));
    return [
      { label: 'ω₁(t) [rad/s]', data: w1, color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.15)' },
      { label: 'ω₂(t) [rad/s]', data: w2, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)' },
    ];
  }, [history]);

  const miniPhaseDatasets = useMemo(() => {
    const pts = history.map((p) => ({ x: p.theta2, y: p.omega2 }));
    const current = [{ x: stateA.theta2, y: stateA.omega2 }];
    return [
      { label: 'Orbit (θ₂, ω₂)', data: pts, color: '#a855f7', borderWidth: 1.4 },
      { label: 'Current State', data: current, color: '#00e5ff', bgColor: '#00e5ff', pointRadius: 5, showLine: false },
    ];
  }, [history, stateA]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PendulumCanvas
        stateA={stateA}
        stateB={stateB}
        params={params}
        trailA={trailA}
        trailB={trailB}
        compareMode={compareMode}
        simTime={simTime}
        title="Interactive Double Pendulum Simulation"
      />

      <div className="grid-2">
        <ScientificChart
          title="Angular Displacement vs Time"
          subtitle="Generalized coordinates θ₁(t) and θ₂(t)"
          xLabel="Time t (s)"
          yLabel="Angle θ (rad)"
          datasets={angleDatasets}
          exportName="angular_displacement_vs_time.png"
        />
        <ScientificChart
          title="Angular Velocity vs Time"
          subtitle="Generalized velocities ω₁(t) and ω₂(t)"
          xLabel="Time t (s)"
          yLabel="Angular Velocity ω (rad/s)"
          datasets={velocityDatasets}
          exportName="angular_velocity_vs_time.png"
        />
      </div>

      <ScientificChart
        title="Live Phase Portrait Preview (θ₂ vs ω₂)"
        subtitle="Outer bob phase-space trajectory evolving in real time"
        xLabel="θ₂ (rad)"
        yLabel="ω₂ (rad/s)"
        datasets={miniPhaseDatasets}
        exportName="live_phase_portrait_theta2_omega2.png"
      />
    </div>
  );
}
