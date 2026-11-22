'use strict';
/* Lab catalogue data: categories, plain descriptions, experiment defaults and standard experiments
   (protocols) for the original labs. Newer labs carry these fields in their own definition. */
(function () {
  const P = window.PhysLab;
  P.meta = {
    electrons: 'Electricity & Magnetism', gravity: 'Mechanics', ripple: 'Waves & Optics', pendulum: 'Mechanics', gas: 'Thermodynamics & Statistical',
    lorentz: 'Electricity & Magnetism', optics: 'Waves & Optics', fluid: 'Mechanics', projectile: 'Mechanics', cloth: 'Mechanics',
    quantum: 'Quantum & Modern', blackhole: 'Quantum & Modern', matter: 'Thermodynamics & Statistical', ising: 'Thermodynamics & Statistical', string: 'Waves & Optics',
  };
  P.subtitles = {
    electrons: 'Coulomb N-body simulation of point charges with live electric field and potential maps; Rutherford scattering.',
    gravity: 'Newtonian N-body integrator (leapfrog) with energy and momentum diagnostics, orbits and preset systems.',
    ripple: '2-D scalar wave equation on a grid: interference, diffraction, refraction, Doppler shift and wave-guides.',
    pendulum: 'Double pendulum integrated with RK4: energy conservation, phase space and Lyapunov exponent.',
    gas: 'Hard-disc molecular dynamics: ideal-gas law, Maxwell–Boltzmann speeds, P–V work, mean free path.',
    lorentz: 'Charged particles in E and B fields: gyration, E×B and grad-B drifts, cyclotron and mass spectrometer.',
    optics: 'Geometric ray tracing with Snell’s law and Cauchy dispersion: lenses, mirrors, prisms, fibres, gratings.',
    fluid: 'Incompressible Navier–Stokes (stable fluids): wind tunnel, vortex shedding, Strouhal number, lift and drag.',
    projectile: 'Ballistics with quadratic air drag and Magnus force on Earth, Moon, Mars and more; range and energy loss.',
    cloth: 'Mass–spring cloth with Verlet integration and constraint relaxation: strain, tearing and wind loads.',
    quantum: 'Time-dependent Schrödinger equation (split-step): tunnelling, reflection, bound states and measurement.',
    blackhole: 'Null and timelike geodesics around a Schwarzschild black hole: light bending, photon sphere, ISCO.',
    matter: 'Lennard-Jones molecular dynamics: melting, boiling, crystallisation and phase behaviour in reduced units.',
    ising: '2-D Ising model by Metropolis / Wolff Monte Carlo: magnetisation, critical point T_c, hysteresis.',
    string: 'Vibrating string by modal synthesis: harmonics, standing waves, driven resonance and tuning.',
  };
  // labs whose reset() loads a preset — keep the user's set-up when a recording starts
  P.noResetOnRun = ['blackhole', 'electrons', 'gravity', 'optics', 'cloth', 'fluid', 'lorentz', 'ripple'];
  P.expDefaults = {
    pendulum: { duration: 20, interval: 0.02, param: 'θ₁ (upper)', from: 5, to: 175, points: 18, action: 'Release', settle: 0, measure: 15, stat: 'max' },
    projectile: { mode: 'sweep', param: 'Launch angle θ', from: 5, to: 85, points: 17, action: '🔥 Fire (F)', resetEach: true, settle: 0, measure: 12, stat: 'final' },
    gas: { duration: 20, interval: 0.1, param: 'Temperature k_BT', settle: 2, measure: 4 },
    ising: { duration: 30, interval: 0.1, param: 'Temperature k_BT / J', from: 1.2, to: 3.6, points: 13, settle: 3, measure: 5 },
    string: { duration: 5, interval: 0.01, param: 'Driver frequency', settle: 2, measure: 3, stat: 'max' },
    quantum: { duration: 20, interval: 0.05 },
    matter: { duration: 30, interval: 0.1, param: 'Temperature T*', from: 0.1, to: 1.2, points: 12, settle: 4, measure: 4 },
    gravity: { duration: 60, interval: 0.1 },
    lorentz: { duration: 20, interval: 0.05 },
    fluid: { duration: 30, interval: 0.1, param: 'Inflow speed U (tunnel)', settle: 6, measure: 6 },
  };
  P.protocols = {
    pendulum: [
      { t: 'Energy conservation of the integrator', h: 'Damping 0, record 30 s. Plot “Energy drift” against time: an RK4 integrator should stay far below 10⁻³ %. Repeat with large angles.', setup: { set: { Damping: 0 }, press: 'Release', mode: 'time', duration: 30, interval: 0.05, x: 'Time', y: 'Energy drift' } },
      { t: 'Lyapunov exponent vs starting angle', h: 'Butterfly mode, sweep θ₁ from 10° to 170°, release at each point and record the largest λ estimate. Regular motion gives λ ≈ 0, chaos gives λ > 0.', setup: { set: { Experiment: 'pair', Damping: 0 }, mode: 'sweep', param: 'θ₁ (upper)', from: 10, to: 170, points: 17, action: 'Release', settle: 0, measure: 12, stat: 'max', y: 'Lyapunov λ ≈' } },
      { t: 'Small-angle oscillation', h: 'Press “Gentle (regular)” and record 20 s. Fit a sinusoid to θ₁(t) and compare the period with 2π√(L/g) for the coupled system.', setup: { press: 'Gentle (regular)', mode: 'time', duration: 20, interval: 0.02, x: 'Time', y: 'θ₁', fit: 'sine' } },
    ],
    projectile: [
      { t: 'Range vs launch angle (with drag)', h: 'Sweep the angle from 5° to 85°; each point fires one shot and records the final range. With air the optimum lies below 45°; set air density 0 to recover the vacuum parabola.', setup: { mode: 'sweep', param: 'Launch angle θ', from: 5, to: 85, points: 17, action: '🔥 Fire (F)', resetEach: true, settle: 0, measure: 12, stat: 'final', y: 'Range', fit: 'quad' } },
      { t: 'Range vs launch speed in vacuum', h: 'Air density 0, angle 45°: sweep v₀. Range should follow R = v₀²/g — fit a power law and check n = 2.', setup: { set: { 'Air density ρ': 0, 'Launch angle θ': 45, 'Launch height h₀': 0 }, mode: 'sweep', param: 'Launch speed v₀', from: 5, to: 50, points: 10, action: '🔥 Fire (F)', resetEach: true, settle: 0, measure: 12, stat: 'final', y: 'Range', fit: 'power' } },
      { t: 'Terminal velocity', h: 'Record a time series of a single high shot and look at “Speed”; compare with the terminal velocity readout.', setup: { mode: 'time', duration: 12, interval: 0.05, press: '🔥 Fire (F)', reset: false, y: 'Speed' } },
    ],
    gas: [
      { t: 'Ideal-gas law: P vs T', h: 'Sweep k_BT with the thermostat on and record mean pressure. A straight line through the origin confirms P ∝ T at constant V and N.', setup: { set: { 'Thermostat (hold T constant)': true }, mode: 'sweep', param: 'Temperature k_BT', points: 8, settle: 2, measure: 4, stat: 'mean', y: 'Pressure P', fit: 'linear' } },
      { t: 'Compressibility factor', h: 'Record PA/Nk_BT over time. For an ideal gas it is 1; with larger molecule radius it rises (excluded volume, van der Waals b).', setup: { mode: 'time', duration: 20, interval: 0.1, y: 'PA / Nk_BT' } },
      { t: 'Mean free path vs number density', h: 'Sweep the number of molecules and record the mean free path. Fit a power law: λ ∝ n⁻¹.', setup: { mode: 'sweep', param: 'Number of molecules', points: 8, settle: 1, measure: 3, stat: 'mean', y: 'Mean free path', fit: 'power' } },
    ],
    ising: [
      { t: 'Magnetisation curve and T_c', h: 'Sweep T from 1.2 to 3.6 and record ⟨|M|⟩. Compare with the exact Onsager readout; the drop marks T_c = 2.269 J/k_B.', setup: { set: { 'External field h': 0 }, mode: 'sweep', param: 'Temperature k_BT / J', from: 1.2, to: 3.6, points: 13, settle: 3, measure: 5, stat: 'mean', y: 'Magnetisation M' } },
      { t: 'Energy per spin vs temperature', h: 'Same sweep, plot energy per spin; its slope is the heat capacity, which peaks at T_c.', setup: { mode: 'sweep', param: 'Temperature k_BT / J', from: 1.2, to: 3.6, points: 13, settle: 3, measure: 5, stat: 'mean', y: 'Energy / spin' } },
      { t: 'Relaxation after a quench', h: 'Press “Quench to T = 1.5” then record 30 s: watch domains coarsen in M(t) and energy(t).', setup: { press: '❄ Quench to T = 1.5', mode: 'time', duration: 30, interval: 0.1, reset: false, y: 'Energy / spin' } },
    ],
    string: [
      { t: 'Resonance curve of the string', h: 'Turn on “Shake the left end” and sweep the driver frequency through 0.5–3.5 f₁. Peaks of the peak amplitude mark the harmonics.', setup: { set: { 'Shake the left end': true }, mode: 'sweep', param: 'Driver frequency', points: 31, settle: 2, measure: 2, stat: 'max', y: 'Peak amplitude' } },
      { t: 'Mersenne’s laws: f₁ vs tension', h: 'Sweep the tension and record f₁. A power-law fit should give exponent ½ (f₁ = (1/2L)√(T/μ)).', setup: { mode: 'sweep', param: 'Tension T', points: 10, settle: 0.2, measure: 0.3, stat: 'mean', y: 'Fundamental f₁', fit: 'power' } },
      { t: 'f₁ vs length', h: 'Sweep the length and fit a power law: the exponent should be −1.', setup: { mode: 'sweep', param: 'Length L', points: 10, settle: 0.2, measure: 0.3, stat: 'mean', y: 'Fundamental f₁', fit: 'power' } },
    ],
    quantum: [
      { t: 'Tunnelling probability vs barrier height', h: 'Barrier preset: sweep V₀, fire a packet at each point and record the final transmitted fraction. Compare with the plane-wave theory readout.', setup: { press: 'Barrier', mode: 'sweep', param: 'Barrier height V₀', points: 10, action: '▶ Fire packet', settle: 0, measure: 12, stat: 'final', y: 'Transmitted' } },
      { t: 'Norm conservation', h: 'Fire a packet and record the norm over time with absorbing edges off: a unitary integrator keeps ∫|ψ|²dx = 1.', setup: { set: { 'Absorbing edges (open space)': false }, press: '▶ Fire packet', mode: 'time', duration: 15, interval: 0.05, reset: false, y: 'Norm ∫|ψ|²dx' } },
    ],
    matter: [
      { t: 'Caloric curve (melting)', h: 'Thermostat on: sweep T* from 0.1 to 1.2 and record potential energy per atom. The jump marks the latent heat of melting.', setup: { set: { 'Thermostat (hold T at target)': true }, mode: 'sweep', param: 'Temperature T*', from: 0.1, to: 1.2, points: 12, settle: 4, measure: 4, stat: 'mean', y: 'Potential E / atom' } },
      { t: 'Order parameter', h: 'Same sweep, plot “6-fold atoms” (local hexagonal order) — it collapses at the melting point.', setup: { mode: 'sweep', param: 'Temperature T*', from: 0.1, to: 1.2, points: 12, settle: 4, measure: 4, stat: 'mean', y: '6-fold atoms' } },
    ],
    gravity: [
      { t: 'Energy and momentum conservation', h: 'Record the solar system for 60 s and plot total energy and |momentum|. Drift indicates integration error; reduce speed to see it shrink.', setup: { press: 'Solar system', mode: 'time', duration: 60, interval: 0.1, reset: false, y: 'Total energy' } },
      { t: 'Virial ratio of a star cluster', h: 'Load the star cluster and record kinetic/|potential|; a relaxed self-gravitating system approaches 0.5.', setup: { press: 'Star cluster', mode: 'time', duration: 60, interval: 0.2, reset: false, y: 'Kinetic / |Potential|' } },
    ],
    fluid: [
      { t: 'Vortex shedding frequency', h: 'Use a wind-tunnel set-up and record the Strouhal number or lift over time; fit a sinusoid to the lift signal to get the shedding frequency.', setup: { mode: 'time', duration: 30, interval: 0.05, reset: false } },
    ],
    lorentz: [
      { t: 'Gyration period vs field strength', h: 'Launch a particle, sweep B_z and record the gyro-period. A power-law fit gives T ∝ B⁻¹ (T = 2πm/qB).', setup: { mode: 'sweep', param: 'Magnetic field B_z', points: 8, settle: 0.5, measure: 1, stat: 'mean', y: 'Gyro-period T', fit: 'power' } },
    ],
    electrons: [
      { t: 'Kinetic energy of a relaxing plasma', h: 'Load Plasma and record kinetic energy over time with some damping; fit an exponential to the decay.', setup: { press: 'Plasma', mode: 'time', duration: 20, interval: 0.1, reset: false, y: 'Kinetic energy', fit: 'exp' } },
    ],
    blackhole: [
      { t: 'Light deflection vs impact parameter', h: 'Fire single photons at different heights and compare “Last deflection” with the weak-field formula 2r_s/b shown below it.', setup: null },
    ],
    optics: [
      { t: 'Refraction and dispersion', h: 'Select a prism or lens and read n for blue and red light and the critical angle; vary the dispersion strength and watch the spectrum spread.', setup: null },
    ],
    ripple: [
      { t: 'Interference pattern', h: 'Load the double slit, switch the view to Intensity and save a screenshot; fringe spacing follows Δy = λL/d. For a quantitative version use the Diffraction lab.', setup: null },
    ],
    cloth: [
      { t: 'Strain under load', h: 'Record mean and max stretch over time while changing gravity or wind; tearing begins when max stretch exceeds the tear threshold.', setup: { mode: 'time', duration: 20, interval: 0.1, reset: false, y: 'Max stretch' } },
    ],
  };
})();
