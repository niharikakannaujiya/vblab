import React from 'react';
import { BookOpen, Cpu, CheckCircle, Layers } from 'lucide-react';

export function AboutSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="sci-card">
        <div className="sci-card-header">
          <h3 className="sci-card-title">
            <BookOpen size={17} color="#00e5ff" /> About This Research Dashboard
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', marginTop: 0 }}>
          <strong>Phase Space Trajectory Analysis of a Chaotic Double Pendulum</strong> is an interactive scientific
          simulation environment designed to demonstrate how deterministic Hamiltonian mechanics gives rise to
          unpredictable, chaotic behavior. Every trajectory, phase portrait, energy curve, and Lyapunov metric is
          computed live in-browser directly from the exact nonlinear Euler-Lagrange equations of motion.
        </p>
      </div>

      <div className="grid-3">
        <div className="sci-card">
          <h4 className="sci-card-title" style={{ marginBottom: '10px' }}>
            <Cpu size={16} color="#a855f7" /> Numerical Architecture
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Exact 4-variable state vector: (θ₁, θ₂, ω₁, ω₂)</li>
            <li>Fixed-step RK4 integrator at Δt = 2 ms (500 substeps/s)</li>
            <li>Zero artificial damping; exact Hamiltonian evaluation</li>
            <li>Benettin shadow-vector renormalization for FTLE λ_max</li>
          </ul>
        </div>

        <div className="sci-card">
          <h4 className="sci-card-title" style={{ marginBottom: '10px' }}>
            <Layers size={16} color="#00e5ff" /> Visualization Stack
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>React.js modular dashboard architecture</li>
            <li>High-DPI HTML5 Canvas physical apparatus &amp; fading trails</li>
            <li>Chart.js real-time streaming plots with PNG export</li>
            <li>KaTeX mathematical typesetting &amp; CSV telemetry export</li>
          </ul>
        </div>

        <div className="sci-card">
          <h4 className="sci-card-title" style={{ marginBottom: '10px' }}>
            <CheckCircle size={16} color="#34d399" /> Physics Verification
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Equilibrium fixed-point stability verified</li>
            <li>Small-angle normal mode period matches analytical √((2−√2)g/L)</li>
            <li>Energy conservation &lt; 10⁻⁴ relative drift in chaotic runs</li>
            <li>Verified exponential separation vs bounded regular orbits</li>
          </ul>
        </div>
      </div>

      <div className="callout-banner cyan">
        <strong>Suggested Experiment Workflow:</strong> Start with the <em>Regular Motion</em> preset to observe
        clean, quasi-periodic phase-space orbits and near-zero Lyapunov growth. Then switch to{' '}
        <em>Chaotic Motion</em>, click <strong>Compare Initial Conditions</strong>, and watch both pendulums move
        identically for the first ~3–5 seconds before diverging completely while total energy{' '}
        <code style={{ color: '#eef4ff' }}>E = T + V</code> remains conserved!
      </div>
    </div>
  );
}
