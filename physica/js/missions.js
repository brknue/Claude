'use strict';
/* Missions: three auto-checked challenges per lab. `ok(p)` receives the lab's probe() snapshot. */
PhysLab.missions = {
  electrons: [
    { t: 'Fire the Rutherford experiment', h: 'Press “Rutherford scattering” and let at least 40 alpha particles fly past the nucleus.', ok: (p) => p.fired >= 40 },
    { t: 'Build a neutral plasma', h: 'Have at least 25 electrons and the same number of protons (±3) in the chamber.', ok: (p) => p.ne >= 25 && Math.abs(p.ne - p.np) <= 3 },
    { t: 'Magnetic confinement', h: 'Switch on the magnetic field (|B| ≥ 4) with at least 40 electrons inside.', ok: (p) => Math.abs(p.B) >= 4 && p.ne >= 40 },
  ],
  gravity: [
    { t: 'Achieve a stable, near-circular orbit', h: 'Launch your own body so that after 4 s its orbit has eccentricity below 0.25. Hover a body to see its orbit.', ok: (p) => p.minE < 0.25 },
    { t: 'Cosmic collision', h: 'Make two bodies collide and merge (merging must be on).', ok: (p) => p.merges >= 1 },
    { t: 'Run time backwards', h: 'Press “Reverse time” and watch every orbit retrace itself.', ok: (p) => p.rev >= 1 },
  ],
  ripple: [
    { t: 'Break the sound barrier', h: 'In the Doppler preset push the source above Mach 1 to form a shock cone.', ok: (p) => p.preset === 'doppler' && p.mach > 1.05 },
    { t: 'Photograph interference fringes', h: 'Run the Double slit preset and switch the view to Intensity.', ok: (p) => p.preset === 'double' && p.view === 'intensity' && p.steps > 300 },
    { t: 'Build a five-source array', h: 'Place five or more point sources in the tank.', ok: (p) => p.nsrc >= 5 },
  ],
  pendulum: [
    { t: 'Witness the butterfly effect', h: 'In Butterfly mode, wait until the two pendulums have completely diverged.', ok: (p) => p.mode === 'pair' && p.div > 1 },
    { t: 'Explore the chaos map', h: 'Click three different spots on the chaos map to launch from there.', ok: (p) => p.clicks >= 3 },
    { t: 'Run a big ensemble', h: 'Run Ensemble mode with at least 60 pendulums for 10 seconds.', ok: (p) => p.mode === 'ensemble' && p.n >= 60 && p.time > 10 },
  ],
  gas: [
    { t: 'Compress the gas to half its volume', h: 'Drag the piston until the volume is below 50 %.', ok: (p) => p.vol < 0.5 },
    { t: 'Let Maxwell\'s demon work', h: 'Start “Maxwell\'s demon” and wait until the right side is 25 % hotter than the left.', ok: (p) => p.demon && p.ratio > 1.25 },
    { t: 'Heat the gas past 60 k', h: 'Use the slider, the heat buttons, the mouse — or fast compression.', ok: (p) => p.kT > 60000 },
  ],
  lorentz: [
    { t: 'Weigh ions', h: 'Detect 25 ions in the Mass spectrometer.', ok: (p) => p.preset === 'spectro' && p.hits >= 25 },
    { t: 'Reach 450 px/s in the cyclotron', h: 'Keep the RF tuned to resonance and let the particle spiral out.', ok: (p) => p.preset === 'cyclo' && p.vmax > 450 },
    { t: 'Design your own magnet', h: 'Paint at least 40 cells of magnetic field with the field brush.', ok: (p) => p.painted >= 40 },
  ],
  optics: [
    { t: 'Split white light into a spectrum', h: 'Land red and blue light at least 25 px apart on a screen (prism or grating).', ok: (p) => p.spread > 25 },
    { t: 'Use a diffraction grating', h: 'Add a grating to the bench (or load the Grating spectrometer).', ok: (p) => p.types.includes('grating') },
    { t: 'Build a complex bench', h: 'Have at least 7 elements on the table at once.', ok: (p) => p.n >= 7 },
  ],
  fluid: [
    { t: 'Measure the Strouhal number', h: 'In a wind-tunnel preset, wait for steady vortex shedding with St between 0.1 and 0.35.', ok: (p) => p.St > 0.1 && p.St < 0.35 },
    { t: 'See the spin', h: 'Switch the view to Vorticity while the tunnel is running.', ok: (p) => p.view === 'vort' && p.tunnel },
    { t: 'Sculpt your own obstacle', h: 'Paint or erase an obstacle in the flow.', ok: (p) => p.painted },
  ],
  projectile: [
    { t: 'Hit the target', h: 'Land a shot on the red-and-white target.', ok: (p) => p.hits >= 1 },
    { t: 'Sharpshooter', h: 'Hit three targets.', ok: (p) => p.hits >= 3 },
    { t: 'Curve ball', h: 'Hit a target with at least 15 rev/s of spin on the ball.', ok: (p) => p.spinHits >= 1 },
  ],
  cloth: [
    { t: 'Rip it', h: 'Tear at least 60 links by pulling or cutting.', ok: (p) => p.torn >= 60 },
    { t: 'Play with fire', h: 'Use the Burn tool and let the fire consume 150 points of cloth.', ok: (p) => p.burned >= 150 },
    { t: 'Target practice', h: 'Throw three balls into the cloth.', ok: (p) => p.balls >= 3 },
  ],
  quantum: [
    { t: 'Tunnel through a wall', h: 'With the packet energy below the barrier height, get more than 30 % transmitted.', ok: (p) => p.preset === 'barrier' && p.E < p.V0 && p.T > 0.3 && p.time > 400 },
    { t: 'Collapse the wavefunction', h: 'Press “Measure position” three times.', ok: (p) => p.meas >= 3 },
    { t: 'Trap a particle in a box', h: 'Load a “particle in a box” state and let it slosh for a while.', ok: (p) => p.box && p.time > 1500 },
  ],
  blackhole: [
    { t: 'Feed the black hole', h: 'Let it capture 15 photons or particles.', ok: (p) => p.captured >= 15 },
    { t: 'Survive in orbit', h: 'Put matter into an orbit that lasts a long time without falling in.', ok: (p) => p.longOrbit },
    { t: 'Make an Einstein ring', h: 'Switch on the lensing camera and drag the galaxy directly behind the black hole.', ok: (p) => p.ring },
  ],
  matter: [
    { t: 'Melt a crystal', h: 'Start from Crystal and heat until the detected phase is Liquid.', ok: (p) => p.melted },
    { t: 'Freeze a gas into a solid', h: 'Start with a gas and cool it until crystals are detected.', ok: (p) => p.frozeAfterGas },
    { t: 'Impact test', h: 'Fire three projectiles into the atoms with the Shoot tool.', ok: (p) => p.shots >= 3 },
  ],
  ising: [
    { t: 'Magnetise it', h: 'Reach |M| above 0.9 with zero external field.', ok: (p) => p.absM > 0.9 && p.h === 0 },
    { t: 'Sit on the critical point', h: 'Hold T within 0.04 of T_c for 300 sweeps.', ok: (p) => Math.abs(p.T - 2.269) < 0.04 && p.samples > 150 },
    { t: 'Trace a hysteresis loop', h: 'Below T_c, switch on Auto-sweep field and complete a loop.', ok: (p) => p.loop > 1200 && p.T < 2.2 },
  ],
  string: [
    { t: 'Isolate the 3rd harmonic', h: 'Make n = 3 the strongest harmonic.', ok: (p) => p.dom === 3 && p.peak > 0.1 },
    { t: 'Find a resonance', h: 'With the driver on, tune its frequency until the string swings past 0.4.', ok: (p) => p.drive && p.peak > 0.4 },
    { t: 'Play a tune', h: 'Play eight notes on the keyboard (keys A S D F G J K L).', ok: (p) => p.notes >= 8 },
  ],
};
