import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESETS,
  computeAccelerations,
  rk4Step,
  computeKinematics,
  computeEnergy,
  computeSeparation,
  createLyapunovTracker,
  stepLyapunovTracker,
  wrapAngle,
} from '../src/physics/doublePendulum.js';
import { buildSimulationCsv } from '../src/utils/exportData.js';

function simulate(initialState, params, durationSec, dt = 0.002) {
  let state = { ...initialState };
  const steps = Math.round(durationSec / dt);
  const initialEnergy = computeEnergy(state, params).total;
  let maxRelError = 0;

  for (let i = 0; i < steps; i++) {
    state = rk4Step(state, params, dt);
    const e = computeEnergy(state, params).total;
    if (initialEnergy > 1e-9) {
      const relErr = Math.abs(e - initialEnergy) / initialEnergy;
      if (relErr > maxRelError) maxRelError = relErr;
    }
  }
  return { finalState: state, initialEnergy, finalEnergy: computeEnergy(state, params).total, maxRelError };
}

test('Downward equilibrium remains stationary with zero acceleration', () => {
  const eq = { theta1: 0, theta2: 0, omega1: 0, omega2: 0 };
  const params = PRESETS.regular.params;
  const deriv = computeAccelerations(eq, params);
  assert.equal(deriv.dTheta1, 0);
  assert.equal(deriv.dTheta2, 0);
  assert.equal(deriv.dOmega1, 0);
  assert.equal(deriv.dOmega2, 0);

  const next = rk4Step(eq, params, 0.002);
  assert.deepEqual(next, eq);
  assert.deepEqual(computeEnergy(eq, params), { kinetic: 0, potential: 0, total: 0 });
});

test('RK4 conserves total mechanical energy across Regular, Chaotic, and Extreme presets', () => {
  const reg = simulate(PRESETS.regular.initialState, PRESETS.regular.params, 15, 0.002);
  assert.ok(reg.maxRelError < 1e-7, `Regular energy error too high: ${reg.maxRelError}`);

  const chaotic = simulate(PRESETS.chaotic.initialState, PRESETS.chaotic.params, 20, 0.002);
  assert.ok(chaotic.maxRelError < 1e-5, `Chaotic energy error too high: ${chaotic.maxRelError}`);

  const extreme = simulate(PRESETS.extreme.initialState, PRESETS.extreme.params, 20, 0.002);
  assert.ok(extreme.maxRelError < 1e-4, `Extreme energy error too high: ${extreme.maxRelError}`);
});

test('Small-angle symmetric normal mode matches analytical frequency', () => {
  // For m1=m2=1, L1=L2=1, g=9.81:
  // Normal mode frequencies: omega^2 = (2 +/- sqrt(2)) * g / L
  // In-phase mode (lower frequency): theta2 / theta1 = +sqrt(2)
  const params = { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81 };
  const theta1_0 = 0.005;
  const theta2_0 = theta1_0 * Math.SQRT2;
  const omegaMinus = Math.sqrt((2 - Math.SQRT2) * (params.g / params.L1));
  const period = (2 * Math.PI) / omegaMinus;

  const res = simulate({ theta1: theta1_0, theta2: theta2_0, omega1: 0, omega2: 0 }, params, period, 0.001);
  assert.ok(Math.abs(res.finalState.theta1 - theta1_0) < 1e-4, 'Should complete one full normal-mode period');
  assert.ok(Math.abs(res.finalState.theta2 - theta2_0) < 1e-4, 'Second angle should return after one period');
});

test('Chaotic preset exhibits exponential sensitivity to initial conditions and positive Lyapunov estimate', () => {
  const params = PRESETS.chaotic.params;
  const eps = 1e-4;
  let stateA = { ...PRESETS.chaotic.initialState };
  let stateB = { ...PRESETS.chaotic.initialState, theta1: stateA.theta1 + eps };
  const tracker = createLyapunovTracker(stateA, 1e-6, 0.2);

  const dt = 0.002;
  const steps = Math.round(15 / dt);
  for (let i = 0; i < steps; i++) {
    stateA = rk4Step(stateA, params, dt);
    stateB = rk4Step(stateB, params, dt);
    stepLyapunovTracker(tracker, stateA, params, dt);
  }

  const sep = computeSeparation(stateA, stateB);
  assert.ok(sep.angularSeparation > 0.5, `Expected large chaotic divergence, got ${sep.angularSeparation}`);
  assert.ok(tracker.currentEstimate > 0.5, `Expected positive Lyapunov estimate in chaos, got ${tracker.currentEstimate}`);

  // Compare against regular motion which stays bounded and decays toward 0 over longer duration
  let regA = { ...PRESETS.regular.initialState };
  let regB = { ...PRESETS.regular.initialState, theta1: regA.theta1 + eps };
  const regTracker = createLyapunovTracker(regA, 1e-6, 0.25);
  const regSteps = Math.round(30 / dt);
  for (let i = 0; i < regSteps; i++) {
    regA = rk4Step(regA, PRESETS.regular.params, dt);
    regB = rk4Step(regB, PRESETS.regular.params, dt);
    stepLyapunovTracker(regTracker, regA, PRESETS.regular.params, dt);
  }
  const regSep = computeSeparation(regA, regB);
  assert.ok(regSep.angularSeparation < 0.015, `Regular motion should remain closely bounded, got ${regSep.angularSeparation}`);
  assert.ok(
    regTracker.currentEstimate < 0.12 && regTracker.currentEstimate < tracker.currentEstimate * 0.15,
    `Regular Lyapunov estimate should decay near zero and be far below chaotic estimate, got ${regTracker.currentEstimate}`
  );
});

test('Kinematics, angle wrapping, and CSV export produce valid output', () => {
  const kin = computeKinematics({ theta1: Math.PI / 2, theta2: 0, omega1: 0, omega2: 0 }, { L1: 1.5, L2: 1.0 });
  assert.ok(Math.abs(kin.x1 - 1.5) < 1e-12);
  assert.ok(Math.abs(kin.y1) < 1e-12);
  assert.ok(Math.abs(kin.x2 - 1.5) < 1e-12);
  assert.ok(Math.abs(kin.y2 + 1.0) < 1e-12);

  assert.ok(Math.abs(wrapAngle(3 * Math.PI) + Math.PI) <= 1e-12 || Math.abs(wrapAngle(3 * Math.PI) - Math.PI) <= 1e-12);

  const csv = buildSimulationCsv(
    [
      {
        t: 0,
        theta1: 1,
        theta2: 2,
        omega1: 0,
        omega2: 0,
        kinetic: 0,
        potential: 10,
        total: 10,
        x1: 0.84,
        y1: -0.54,
        x2: 1.75,
        y2: -0.12,
        angularSeparation: 1e-4,
        lyapunov: 0.5,
      },
    ],
    PRESETS.chaotic.params
  );
  assert.ok(csv.includes('time_s,theta1_rad'));
  assert.ok(csv.includes('1.00000e-4'));
});
