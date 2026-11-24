import React, { useMemo, useState } from 'react';
import { Compass, Grid2X2, Maximize2 } from 'lucide-react';
import { wrapAngle } from '../physics/doublePendulum';
import { ScientificChart } from './ScientificChart';
import { PendulumCanvas } from './PendulumCanvas';

const PHASE_PLANES = [
  {
    id: 'theta1_omega1',
    label: 'θ₁ vs ω₁',
    title: 'Phase Space: θ₁ vs ω₁ (Inner Pendulum)',
    subtitle: 'Projection onto the inner bob angle-velocity plane',
    xKey: 'theta1',
    yKey: 'omega1',
    xWrap: true,
    yWrap: false,
    xLabel: 'θ₁ (rad)',
    yLabel: 'ω₁ (rad/s)',
    color: '#00e5ff',
    colorB: '#f59e0b',
  },
  {
    id: 'theta2_omega2',
    label: 'θ₂ vs ω₂',
    title: 'Phase Space: θ₂ vs ω₂ (Outer Pendulum)',
    subtitle: 'Projection onto the outer bob angle-velocity plane',
    xKey: 'theta2',
    yKey: 'omega2',
    xWrap: true,
    yWrap: false,
    xLabel: 'θ₂ (rad)',
    yLabel: 'ω₂ (rad/s)',
    color: '#a855f7',
    colorB: '#f59e0b',
  },
  {
    id: 'theta1_theta2',
    label: 'θ₁ vs θ₂',
    title: 'Configuration Space: θ₁ vs θ₂',
    subtitle: '2-Torus configuration manifold showing coupled angular modes',
    xKey: 'theta1',
    yKey: 'theta2',
    xWrap: true,
    yWrap: true,
    xLabel: 'θ₁ (rad)',
    yLabel: 'θ₂ (rad)',
    color: '#38bdf8',
    colorB: '#f43f5e',
  },
  {
    id: 'omega1_omega2',
    label: 'ω₁ vs ω₂',
    title: 'Velocity Space: ω₁ vs ω₂',
    subtitle: 'Coupled angular momentum transfer between inner and outer bobs',
    xKey: 'omega1',
    yKey: 'omega2',
    xWrap: false,
    yWrap: false,
    xLabel: 'ω₁ (rad/s)',
    yLabel: 'ω₂ (rad/s)',
    color: '#34d399',
    colorB: '#fbbf24',
  },
];

function buildPlaneDatasets(history, stateA, stateB, compareMode, plane, wrapAngles) {
  const mapVal = (val, shouldWrap) => (wrapAngles && shouldWrap ? wrapAngle(val) : val);

  const ptsA = history.map((pt) => ({
    x: mapVal(pt[plane.xKey], plane.xWrap),
    y: mapVal(pt[plane.yKey], plane.yWrap),
  }));

  const currentA = [
    {
      x: mapVal(stateA[plane.xKey], plane.xWrap),
      y: mapVal(stateA[plane.yKey], plane.yWrap),
    },
  ];

  // Note: when wrapAngles is enabled, line segments across +/-pi jump; use scatter-like points or thin line
  const showLine = !(wrapAngles && (plane.xWrap || plane.yWrap));

  const datasets = [
    {
      label: 'Trajectory A',
      data: ptsA,
      color: plane.color,
      bgColor: plane.color,
      borderWidth: 1.4,
      pointRadius: showLine ? 0 : 1.5,
      showLine,
    },
    {
      label: 'Current State A',
      data: currentA,
      color: '#ffffff',
      bgColor: plane.color,
      pointRadius: 5,
      showLine: false,
    },
  ];

  if (compareMode && stateB) {
    const ptsB = history
      .filter((pt) => pt.stateB)
      .map((pt) => ({
        x: mapVal(pt.stateB[plane.xKey], plane.xWrap),
        y: mapVal(pt.stateB[plane.yKey], plane.yWrap),
      }));

    datasets.push({
      label: 'Perturbed B',
      data: ptsB,
      color: plane.colorB,
      bgColor: plane.colorB,
      borderWidth: 1.2,
      borderDash: [4, 3],
      pointRadius: showLine ? 0 : 1.3,
      showLine,
    });
  }

  return datasets;
}

export function PhaseSpaceSection({
  stateA,
  stateB,
  params,
  trailA,
  trailB,
  compareMode,
  simTime,
  history,
}) {
  const [selectedPlaneId, setSelectedPlaneId] = useState('theta1_omega1');
  const [quadView, setQuadView] = useState(false);
  const [wrapAngles, setWrapAngles] = useState(false);

  const activePlane = useMemo(
    () => PHASE_PLANES.find((p) => p.id === selectedPlaneId) || PHASE_PLANES[0],
    [selectedPlaneId]
  );

  const primaryDatasets = useMemo(
    () => buildPlaneDatasets(history, stateA, stateB, compareMode, activePlane, wrapAngles),
    [history, stateA, stateB, compareMode, activePlane, wrapAngles]
  );

  const allPlaneDatasets = useMemo(() => {
    if (!quadView) return [];
    return PHASE_PLANES.map((plane) => ({
      plane,
      datasets: buildPlaneDatasets(history, stateA, stateB, compareMode, plane, wrapAngles),
    }));
  }, [quadView, history, stateA, stateB, compareMode, wrapAngles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Phase Space Toolbar */}
      <div className="sci-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#00e5ff', fontSize: '0.9rem' }}>
              <Compass size={16} /> Phase Plane Projection:
            </span>
            {PHASE_PLANES.map((plane) => (
              <button
                key={plane.id}
                type="button"
                className={`btn btn-chip ${!quadView && selectedPlaneId === plane.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPlaneId(plane.id);
                  setQuadView(false);
                }}
              >
                {plane.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-chip ${wrapAngles ? 'active' : ''}`}
              onClick={() => setWrapAngles((v) => !v)}
              title="Wrap angles onto [-π, π] principal torus"
            >
              Wrap θ ∈ [-π, π]
            </button>
            <button
              type="button"
              className={`btn btn-chip ${quadView ? 'active' : ''}`}
              onClick={() => setQuadView((v) => !v)}
            >
              {quadView ? <Maximize2 size={14} /> : <Grid2X2 size={14} />}
              {quadView ? 'Single Plane View' : '4-Panel Quad View'}
            </button>
          </div>
        </div>
      </div>

      {quadView ? (
        <div className="grid-2">
          {allPlaneDatasets.map(({ plane, datasets }) => (
            <ScientificChart
              key={plane.id}
              title={plane.title}
              subtitle={plane.subtitle}
              xLabel={plane.xLabel}
              yLabel={plane.yLabel}
              datasets={datasets}
              exportName={`phase_space_${plane.id}.png`}
            />
          ))}
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, 0.85fr)' }}>
          <ScientificChart
            title={activePlane.title}
            subtitle={activePlane.subtitle}
            xLabel={activePlane.xLabel}
            yLabel={activePlane.yLabel}
            datasets={primaryDatasets}
            tall
            exportName={`phase_space_${activePlane.id}.png`}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <PendulumCanvas
              stateA={stateA}
              stateB={stateB}
              params={params}
              trailA={trailA}
              trailB={trailB}
              compareMode={compareMode}
              simTime={simTime}
              compact
              title="Synchronized Physical View"
            />
            <div className="callout-banner cyan">
              <strong>Reading the Phase Portrait:</strong> Closed loops or thin banded curves indicate regular
              quasi-periodic orbits confined to invariant KAM tori. Self-intersecting, space-filling tangles arise
              from chaotic trajectories wandering across a 3D constant-energy hypersurface inside 4D phase space.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
