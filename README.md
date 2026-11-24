# Phase Space Trajectory Analysis of a Chaotic Double Pendulum

An interactive university-level physics research dashboard demonstrating deterministic chaos, Hamiltonian energy conservation, and 4D phase-space trajectory geometry for a planar double pendulum.

## Features

- **Exact Nonlinear Lagrangian Physics Engine**: Solves the coupled Euler-Lagrange equations of motion in the 4D state vector $(\theta_1, \theta_2, \omega_1, \omega_2)$ with zero fake or synthetic data.
- **4th-Order Runge-Kutta (RK4) Integrator**: Fixed micro-step integration ($\Delta t = 2\text{ ms}$) preserving total mechanical energy cleanly across regular, chaotic, and extreme regimes.
- **Interactive Physical Apparatus**: High-DPI HTML5 Canvas rendering rigid rods, mass-scaled bobs, downward gravity indicator, adjustable trajectory trails, and Start / Pause / Reset / Step controls.
- **Phase Space Analysis**: Real-time phase portraits for all four canonical 2D projections:
  - $\theta_1$ vs $\omega_1$
  - $\theta_2$ vs $\omega_2$
  - $\theta_1$ vs $\theta_2$
  - $\omega_1$ vs $\omega_2$
  - Includes a **4-Panel Quad View**, optional angle wrapping $\theta \in [-\pi, \pi]$, and twin-trajectory overlay.
- **Chaos Theory & Lyapunov Analysis**:
  - One-click **Compare Initial Conditions** launching two synchronized pendulums separated by $\delta_0 \in \{10^{-2}, 10^{-3}, 10^{-4}, 10^{-5}\}\text{ rad}$.
  - Initial-condition comparison graph ($\theta_2^{(A)}$ vs $\theta_2^{(B)}$), linear/logarithmic angular separation $\Delta\theta(t)$, and Benettin finite-time maximum Lyapunov exponent ($\lambda_{\max}$) convergence plot.
- **Energy Conservation Telemetry**: Live tracking of kinetic energy $T(t)$, potential energy $V(t)$, total mechanical energy $E(t) = T + V$, and numerical drift $\Delta E(t) = E(t) - E_0$.
- **Research Exports**: Export simulation telemetry as **CSV** and download any scientific plot or apparatus snapshot as **PNG**.
- **Theory & Equations**: Full LaTeX-typeset mathematical derivation via KaTeX.

---

## Project Structure

```text
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── tests/
│   └── doublePendulum.test.js      # Physics conservation, normal-mode & chaos unit tests
└── src/
    ├── main.jsx
    ├── index.css                   # Dark scientific theme & responsive grid layout
    ├── App.jsx                     # Simulation loop, state management, & dashboard shell
    ├── physics/
    │   └── doublePendulum.js       # Euler-Lagrange ODEs, RK4 stepper, energy, & Lyapunov tracker
    ├── utils/
    │   └── exportData.js           # CSV & PNG export utilities
    └── components/
        ├── ControlPanel.jsx        # Sliders, presets, transport, & live telemetry
        ├── PendulumCanvas.jsx      # High-DPI Canvas pendulum & trail renderer
        ├── ScientificChart.jsx     # Real-time Chart.js wrapper with PNG export
        ├── MathBlock.jsx           # KaTeX formula renderer
        ├── OverviewSection.jsx     # Dashboard overview & regime launcher
        ├── LiveSimulationSection.jsx
        ├── PhaseSpaceSection.jsx   # 4 phase-space projections & quad view
        ├── ChaosAnalysisSection.jsx
        ├── EnergyAnalysisSection.jsx
        ├── TheorySection.jsx       # Complete mathematical theory & LaTeX equations
        └── AboutSection.jsx
```

---

## Setup & Running Locally

### Prerequisites
- **Node.js** v18+ (tested on Node v26.5.0)
- **npm**

### Install & Start Development Server

```bash
npm install
npm run dev
```

*(On Windows PowerShell if script execution policy blocks `npm`, use `npm.cmd install` and `npm.cmd run dev`.)*

### Run Physics Unit Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Mathematical Model

Let $\theta_1, \theta_2$ be the angles of the inner and outer rods measured from the downward vertical, with point masses $m_1, m_2$, rigid massless rod lengths $L_1, L_2$, and gravitational acceleration $g$:

$$T = \frac{1}{2}(m_1 + m_2) L_1^2 \omega_1^2 + \frac{1}{2} m_2 L_2^2 \omega_2^2 + m_2 L_1 L_2 \omega_1 \omega_2 \cos(\theta_1 - \theta_2)$$

$$V = (m_1 + m_2) g L_1 (1 - \cos\theta_1) + m_2 g L_2 (1 - \cos\theta_2)$$

Applying the Euler-Lagrange equations $\frac{d}{dt}\left(\frac{\partial \mathcal{L}}{\partial \omega_i}\right) - \frac{\partial \mathcal{L}}{\partial \theta_i} = 0$ gives the exact coupled nonlinear accelerations:

$$\dot{\omega}_1 = \frac{-g(2m_1 + m_2)\sin\theta_1 - m_2 g \sin(\theta_1 - 2\theta_2) - 2\sin(\theta_1 - \theta_2)\, m_2 \left(\omega_2^2 L_2 + \omega_1^2 L_1 \cos(\theta_1 - \theta_2)\right)}{L_1 \left(2m_1 + m_2 - m_2 \cos(2\theta_1 - 2\theta_2)\right)}$$

$$\dot{\omega}_2 = \frac{2\sin(\theta_1 - \theta_2)\left(\omega_1^2 L_1 (m_1 + m_2) + g(m_1 + m_2)\cos\theta_1 + \omega_2^2 L_2 m_2 \cos(\theta_1 - \theta_2)\right)}{L_2 \left(2m_1 + m_2 - m_2 \cos(2\theta_1 - 2\theta_2)\right)}$$

---

## Numerical Methods

- **RK4 Integration**: Each animation frame advances simulation time in fixed $\Delta t = 0.002\text{ s}$ steps using 4th-order Runge-Kutta (local truncation error $\mathcal{O}(\Delta t^5)$, global error $\mathcal{O}(\Delta t^4)$).
- **Approximate Lyapunov Exponent**: Computed via Benettin's tangent-space renormalization ($\varepsilon = 10^{-6}$, renormalization interval $0.2\text{ s}$) using a characteristic frequency scale $\omega_c = \sqrt{g / \min(L_1, L_2)}$ for dimensional consistency. Numerical Lyapunov estimates are finite-time approximations that depend on simulation duration, perturbation magnitude, and phase-space metric.
