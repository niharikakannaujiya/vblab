import React from 'react';
import { MathBlock } from './MathBlock';

export function TheorySection() {
  return (
    <div className="theory-article">
      <div className="theory-block">
        <h3>1. What is a Double Pendulum?</h3>
        <p>
          A planar double pendulum consists of two point masses <MathBlock tex="m_1" /> and <MathBlock tex="m_2" />{' '}
          attached sequentially by rigid, massless rods of lengths <MathBlock tex="L_1" /> and <MathBlock tex="L_2" />{' '}
          suspended from a fixed frictionless pivot under uniform downward gravitational acceleration{' '}
          <MathBlock tex="g" />. Its configuration is uniquely specified by two generalized angles{' '}
          <MathBlock tex="\theta_1" /> and <MathBlock tex="\theta_2" /> measured counter-clockwise from the downward
          vertical axis:
        </p>
        <MathBlock
          display
          tex="x_1 = L_1 \sin\theta_1, \quad y_1 = -L_1 \cos\theta_1 \qquad | \qquad x_2 = x_1 + L_2 \sin\theta_2, \quad y_2 = y_1 - L_2 \cos\theta_2"
        />
      </div>

      <div className="theory-block">
        <h3>2. Lagrangian Formulation &amp; Nonlinear Equations of Motion</h3>
        <p>
          Using Lagrangian mechanics, we define the Lagrangian <MathBlock tex="\mathcal{L} = T - V" /> from the total
          kinetic energy <MathBlock tex="T" /> and gravitational potential energy <MathBlock tex="V" /> (referenced so{' '}
          <MathBlock tex="V = 0" /> at <MathBlock tex="\theta_1 = \theta_2 = 0" />):
        </p>
        <MathBlock
          display
          tex="T = \frac{1}{2}(m_1 + m_2) L_1^2 \omega_1^2 + \frac{1}{2} m_2 L_2^2 \omega_2^2 + m_2 L_1 L_2 \omega_1 \omega_2 \cos(\theta_1 - \theta_2)"
        />
        <MathBlock
          display
          tex="V = (m_1 + m_2) g L_1 (1 - \cos\theta_1) + m_2 g L_2 (1 - \cos\theta_2)"
        />
        <p>
          Applying the Euler-Lagrange equations{' '}
          <MathBlock tex="\frac{d}{dt}\left(\frac{\partial \mathcal{L}}{\partial \dot{\theta}_i}\right) - \frac{\partial \mathcal{L}}{\partial \theta_i} = 0" />{' '}
          and solving the coupled <MathBlock tex="2 \times 2" /> linear system for the angular accelerations yields the
          exact first-order ODE system in state vector{' '}
          <MathBlock tex="\mathbf{y} = (\theta_1, \theta_2, \omega_1, \omega_2)^T" />:
        </p>
        <MathBlock
          display
          tex="\dot{\theta}_1 = \omega_1, \qquad \dot{\theta}_2 = \omega_2"
        />
        <MathBlock
          display
          tex="\dot{\omega}_1 = \frac{-g(2m_1 + m_2)\sin\theta_1 - m_2 g \sin(\theta_1 - 2\theta_2) - 2\sin(\theta_1 - \theta_2)\, m_2 \!\left(\omega_2^2 L_2 + \omega_1^2 L_1 \cos(\theta_1 - \theta_2)\right)}{L_1 \left(2m_1 + m_2 - m_2 \cos(2\theta_1 - 2\theta_2)\right)}"
        />
        <MathBlock
          display
          tex="\dot{\omega}_2 = \frac{2\sin(\theta_1 - \theta_2)\!\left(\omega_1^2 L_1 (m_1 + m_2) + g(m_1 + m_2)\cos\theta_1 + \omega_2^2 L_2 m_2 \cos(\theta_1 - \theta_2)\right)}{L_2 \left(2m_1 + m_2 - m_2 \cos(2\theta_1 - 2\theta_2)\right)}"
        />
      </div>

      <div className="theory-block">
        <h3>3. What is Phase Space?</h3>
        <p>
          <strong>Phase space</strong> is the abstract multidimensional space in which every point represents a unique,
          complete instantaneous state of a dynamical system. Because the double pendulum obeys two second-order ODEs,
          its state requires four variables: <MathBlock tex="(\theta_1, \theta_2, \omega_1, \omega_2) \in \mathbb{T}^2 \times \mathbb{R}^2" />.
          By Liouville&apos;s theorem and energy conservation, trajectories are confined to a 3D energy manifold{' '}
          <MathBlock tex="E(\mathbf{y}) = E_0" />. Projecting this 4D orbit onto 2D planes such as{' '}
          <MathBlock tex="(\theta_1, \omega_1)" />, <MathBlock tex="(\theta_2, \omega_2)" />,{' '}
          <MathBlock tex="(\theta_1, \theta_2)" />, and <MathBlock tex="(\omega_1, \omega_2)" /> reveals whether motion
          lies on regular invariant tori or fills chaotic stochastic layers.
        </p>
      </div>

      <div className="theory-block">
        <h3>4. What is Chaotic Motion &amp; Why is a Double Pendulum Chaotic?</h3>
        <p>
          <strong>Deterministic chaos</strong> refers to bounded, aperiodic long-term behavior in a deterministic
          nonlinear system that exhibits extreme sensitivity to initial conditions. At small amplitudes,{' '}
          <MathBlock tex="\sin\theta \approx \theta" /> and <MathBlock tex="\cos(\theta_1-\theta_2) \approx 1" />, so the
          system behaves like two coupled linear harmonic oscillators with integrable normal modes. At higher energies,
          nonlinear trigonometric coupling, centrifugal terms (<MathBlock tex="\omega_i^2 \sin\Delta\theta" />), and
          separatrix crossings destroy KAM invariant tori—making analytical closed-form solutions impossible and
          generating chaotic mixing.
        </p>
      </div>

      <div className="theory-block">
        <h3>5. Sensitivity to Initial Conditions &amp; The Lyapunov Exponent</h3>
        <p>
          Two trajectories starting separated by an infinitesimal perturbation <MathBlock tex="\delta_0 = \|\mathbf{y}_B(0) - \mathbf{y}_A(0)\|" />{' '}
          diverge exponentially in a chaotic regime during the pre-saturation phase:
        </p>
        <MathBlock
          display
          tex="\|\delta(t)\| \approx \delta_0 \, e^{\lambda_{\max} t} \implies \lambda_{\max} = \lim_{t \to \infty} \lim_{\delta_0 \to 0} \frac{1}{t} \ln \left( \frac{\|\delta(t)\|}{\delta_0} \right)"
        />
        <p>
          A positive maximum Lyapunov exponent (<MathBlock tex="\lambda_{\max} > 0" />) is the hallmark signature of
          chaos, defining a finite predictability horizon <MathBlock tex="T_p \sim \frac{1}{\lambda_{\max}} \ln(\Delta_{\text{tol}} / \delta_0)" />.
          In this simulator, <MathBlock tex="\lambda_{\max}" /> is approximated via Benettin&apos;s periodic
          renormalization method over finite time, so numerical values depend on integration duration, perturbation norm,
          and phase-space metric scaling.
        </p>
      </div>

      <div className="theory-block">
        <h3>6. 4th-Order Runge-Kutta (RK4) Numerical Integration</h3>
        <p>
          To integrate <MathBlock tex="\dot{\mathbf{y}} = \mathbf{f}(\mathbf{y})" /> accurately without artificial
          damping, the engine advances with fixed micro-step <MathBlock tex="\Delta t = 0.002\text{ s}" /> using
          classical RK4:
        </p>
        <MathBlock
          display
          tex="\mathbf{k}_1 = \mathbf{f}(\mathbf{y}_n), \quad \mathbf{k}_2 = \mathbf{f}\!\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_1\right), \quad \mathbf{k}_3 = \mathbf{f}\!\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_2\right), \quad \mathbf{k}_4 = \mathbf{f}(\mathbf{y}_n + \Delta t\,\mathbf{k}_3)"
        />
        <MathBlock
          display
          tex="\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{\Delta t}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right) + \mathcal{O}(\Delta t^5)"
        />
      </div>
    </div>
  );
}
