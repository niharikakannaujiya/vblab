/**
 * Exact Nonlinear Double Pendulum Physics Engine
 *
 * Derived from Lagrangian Mechanics:
 *   L = T - V
 * Coordinates (measured from downward vertical):
 *   x1 =  L1 * sin(theta1),  y1 = -L1 * cos(theta1)
 *   x2 =  x1 + L2 * sin(theta2), y2 = y1 - L2 * cos(theta2)
 *
 * State vector: { theta1, theta2, omega1, omega2 } (angles in rad, angular velocities in rad/s)
 */

export const DEFAULT_PARAMS = {
  m1: 1.0, // kg
  m2: 1.0, // kg
  L1: 1.0, // m
  L2: 1.0, // m
  g: 9.81, // m/s^2
};

export const PRESETS = {
  regular: {
    id: 'regular',
    name: 'Regular Motion',
    subtitle: 'Low-energy quasi-periodic regime',
    description:
      'Small initial angles near the stable equilibrium produce smooth, quasi-periodic Lissajous-like motion with near-zero Lyapunov exponent.',
    params: { m1: 1.0, m2: 1.0, L1: 1.0, L2: 1.0, g: 9.81 },
    initialState: {
      theta1: 0.25,
      theta2: -0.15,
      omega1: 0.0,
      omega2: 0.0,
    },
  },
  chaotic: {
    id: 'chaotic',
    name: 'Chaotic Motion',
    subtitle: 'High-energy nonlinear regime',
    description:
      'Large initial displacement (~120° / 135°) supplies enough energy for rapid energy exchange, full rotations, and exponential trajectory divergence.',
    params: { m1: 1.0, m2: 1.0, L1: 1.0, L2: 1.0, g: 9.81 },
    initialState: {
      theta1: (120 * Math.PI) / 180,
      theta2: (135 * Math.PI) / 180,
      omega1: 0.0,
      omega2: 0.0,
    },
  },
  extreme: {
    id: 'extreme',
    name: 'Extreme Motion',
    subtitle: 'Inverted & high angular momentum',
    description:
      'Near-inverted configuration with nonzero initial angular velocities, producing violent flips and dense phase-space exploration.',
    params: { m1: 1.2, m2: 0.8, L1: 1.0, L2: 0.9, g: 9.81 },
    initialState: {
      theta1: (172 * Math.PI) / 180,
      theta2: (-165 * Math.PI) / 180,
      omega1: 2.2,
      omega2: -3.0,
    },
  },
};

/**
 * Computes angular accelerations (dOmega1/dt, dOmega2/dt) from the Euler-Lagrange equations.
 */
export function computeAccelerations(state, params) {
  const { theta1, theta2, omega1, omega2 } = state;
  const { m1, m2, L1, L2, g } = params;

  const delta = theta1 - theta2;
  const sinDelta = Math.sin(delta);
  const cosDelta = Math.cos(delta);
  const denomBase = 2 * m1 + m2 - m2 * Math.cos(2 * delta);

  const num1 =
    -g * (2 * m1 + m2) * Math.sin(theta1) -
    m2 * g * Math.sin(theta1 - 2 * theta2) -
    2 * sinDelta * m2 * (omega2 * omega2 * L2 + omega1 * omega1 * L1 * cosDelta);

  const num2 =
    2 *
    sinDelta *
    (omega1 * omega1 * L1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(theta1) +
      omega2 * omega2 * L2 * m2 * cosDelta);

  const alpha1 = num1 / (L1 * denomBase) || 0;
  const alpha2 = num2 / (L2 * denomBase) || 0;

  return {
    dTheta1: omega1 || 0,
    dTheta2: omega2 || 0,
    dOmega1: alpha1,
    dOmega2: alpha2,
  };
}

/**
 * Advances the state vector by time step dt using 4th-order Runge-Kutta (RK4).
 */
export function rk4Step(state, params, dt) {
  const k1 = computeAccelerations(state, params);

  const s2 = {
    theta1: state.theta1 + 0.5 * dt * k1.dTheta1,
    theta2: state.theta2 + 0.5 * dt * k1.dTheta2,
    omega1: state.omega1 + 0.5 * dt * k1.dOmega1,
    omega2: state.omega2 + 0.5 * dt * k1.dOmega2,
  };
  const k2 = computeAccelerations(s2, params);

  const s3 = {
    theta1: state.theta1 + 0.5 * dt * k2.dTheta1,
    theta2: state.theta2 + 0.5 * dt * k2.dTheta2,
    omega1: state.omega1 + 0.5 * dt * k2.dOmega1,
    omega2: state.omega2 + 0.5 * dt * k2.dOmega2,
  };
  const k3 = computeAccelerations(s3, params);

  const s4 = {
    theta1: state.theta1 + dt * k3.dTheta1,
    theta2: state.theta2 + dt * k3.dTheta2,
    omega1: state.omega1 + dt * k3.dOmega1,
    omega2: state.omega2 + dt * k3.dOmega2,
  };
  const k4 = computeAccelerations(s4, params);

  return {
    theta1: state.theta1 + (dt / 6) * (k1.dTheta1 + 2 * k2.dTheta1 + 2 * k3.dTheta1 + k4.dTheta1),
    theta2: state.theta2 + (dt / 6) * (k1.dTheta2 + 2 * k2.dTheta2 + 2 * k3.dTheta2 + k4.dTheta2),
    omega1: state.omega1 + (dt / 6) * (k1.dOmega1 + 2 * k2.dOmega1 + 2 * k3.dOmega1 + k4.dOmega1),
    omega2: state.omega2 + (dt / 6) * (k1.dOmega2 + 2 * k2.dOmega2 + 2 * k3.dOmega2 + k4.dOmega2),
  };
}

/**
 * Computes Cartesian positions of both masses relative to the fixed pivot (0, 0),
 * with +y pointing upward in physical coordinates.
 */
export function computeKinematics(state, params) {
  const { theta1, theta2 } = state;
  const { L1, L2 } = params;

  const x1 = L1 * Math.sin(theta1);
  const y1 = -L1 * Math.cos(theta1);
  const x2 = x1 + L2 * Math.sin(theta2);
  const y2 = y1 - L2 * Math.cos(theta2);

  return { x1, y1, x2, y2 };
}

/**
 * Computes exact Kinetic (T), Potential (V), and Total Mechanical Energy (E = T + V).
 * Potential energy V is referenced so V = 0 at the stable downward equilibrium (theta1 = 0, theta2 = 0):
 *   V = (m1 + m2)*g*L1*(1 - cos(theta1)) + m2*g*L2*(1 - cos(theta2))
 */
export function computeEnergy(state, params) {
  const { theta1, theta2, omega1, omega2 } = state;
  const { m1, m2, L1, L2, g } = params;

  const kinetic =
    0.5 * (m1 + m2) * L1 * L1 * omega1 * omega1 +
    0.5 * m2 * L2 * L2 * omega2 * omega2 +
    m2 * L1 * L2 * omega1 * omega2 * Math.cos(theta1 - theta2);

  const potential =
    (m1 + m2) * g * L1 * (1 - Math.cos(theta1)) +
    m2 * g * L2 * (1 - Math.cos(theta2));

  return {
    kinetic,
    potential,
    total: kinetic + potential,
  };
}

/**
 * Wraps an angle in radians to the principal interval [-pi, pi].
 */
export function wrapAngle(theta) {
  const twoPi = 2 * Math.PI;
  let wrapped = (theta + Math.PI) % twoPi;
  if (wrapped < 0) wrapped += twoPi;
  return wrapped - Math.PI;
}

/**
 * Computes shortest signed angular difference on S^1 in [-pi, pi].
 */
export function shortestAngleDiff(a, b) {
  return wrapAngle(a - b);
}

/**
 * Computes Euclidean distance between two pendulum states in angle space and full 4D phase space.
 */
export function computeSeparation(stateA, stateB) {
  const dTheta1 = stateB.theta1 - stateA.theta1;
  const dTheta2 = stateB.theta2 - stateA.theta2;
  const dOmega1 = stateB.omega1 - stateA.omega1;
  const dOmega2 = stateB.omega2 - stateA.omega2;

  const wTheta1 = shortestAngleDiff(stateB.theta1, stateA.theta1);
  const wTheta2 = shortestAngleDiff(stateB.theta2, stateA.theta2);

  const angularSeparation = Math.hypot(dTheta1, dTheta2);
  const wrappedAngularSeparation = Math.hypot(wTheta1, wTheta2);
  const phaseSpaceDistance = Math.hypot(dTheta1, dTheta2, dOmega1, dOmega2);

  return {
    dTheta1,
    dTheta2,
    angularSeparation,
    wrappedAngularSeparation,
    phaseSpaceDistance,
  };
}

/**
 * Creates a Benettin finite-time maximum Lyapunov exponent (FTLE) tracker.
 * Integrates a shadow perturbed trajectory alongside the primary state and
 * periodically renormalizes the perturbation vector to prevent overflow/saturation.
 */
export function createLyapunovTracker(initialState, eps = 1e-6, renormPeriod = 0.2) {
  return {
    eps,
    renormPeriod,
    shadowState: {
      theta1: initialState.theta1 + eps,
      theta2: initialState.theta2,
      omega1: initialState.omega1,
      omega2: initialState.omega2,
    },
    accumulatedLogGrowth: 0,
    elapsedSinceRenorm: 0,
    totalTime: 0,
    currentEstimate: 0,
  };
}

/**
 * Advances the Benettin Lyapunov tracker by one RK4 step dt from the pre-step primaryState
 * and post-step nextPrimaryState.
 */
export function stepLyapunovTracker(tracker, nextPrimaryState, params, dt) {
  const nextShadow = rk4Step(tracker.shadowState, params, dt);
  tracker.shadowState = nextShadow;
  tracker.elapsedSinceRenorm += dt;
  tracker.totalTime += dt;

  if (tracker.elapsedSinceRenorm >= tracker.renormPeriod) {
    // Use characteristic frequency omega_c = sqrt(g / min(L1, L2)) to make the phase-space norm dimensionally consistent
    const omegaChar = Math.sqrt(Math.max(params.g, 0.1) / Math.max(Math.min(params.L1, params.L2), 0.1));
    const dT1 = nextShadow.theta1 - nextPrimaryState.theta1;
    const dT2 = nextShadow.theta2 - nextPrimaryState.theta2;
    const dO1 = nextShadow.omega1 - nextPrimaryState.omega1;
    const dO2 = nextShadow.omega2 - nextPrimaryState.omega2;
    const dist = Math.hypot(dT1, dT2, dO1 / omegaChar, dO2 / omegaChar);

    if (dist > 0 && Number.isFinite(dist)) {
      tracker.accumulatedLogGrowth += Math.log(dist / tracker.eps);
      const scale = tracker.eps / dist;
      tracker.shadowState = {
        theta1: nextPrimaryState.theta1 + dT1 * scale,
        theta2: nextPrimaryState.theta2 + dT2 * scale,
        omega1: nextPrimaryState.omega1 + dO1 * scale,
        omega2: nextPrimaryState.omega2 + dO2 * scale,
      };
      if (tracker.totalTime > 0) {
        tracker.currentEstimate = tracker.accumulatedLogGrowth / tracker.totalTime;
      }
    }
    tracker.elapsedSinceRenorm = 0;
  }

  return tracker.currentEstimate;
}
