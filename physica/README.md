# Physica — virtual physics laboratory

23 numerical physics simulations in the browser, built for measuring rather than just watching. Set parameters, record time series or parameter sweeps, fit models to the data and download everything as a PDF report, CSV or JSON. Works on phones, tablets and computers; no build step, no external libraries, fonts or trackers, nothing is uploaded.

Open: https://brknue.github.io/Claude/physica/

## What you can do in every lab

- **Readouts** with units, logged continuously in simulated time. Click one to graph it.
- **Exact parameter entry**: click a slider's value to type a number.
- **Experiment tab**
  - *Time series*: duration, sample interval, optional restart at t = 0.
  - *Parameter sweep*: step one control (linear or logarithmic), optionally press a lab button (e.g. Fire) and restart at each point, wait a settle time, then record the mean ± SD, final value, maximum or minimum of every readout.
  - Optional Gaussian instrument noise; notes that go into the report.
  - **Standard experiments**: one-click set-ups such as resonance curves, Wien's law, Planck's constant, half-life or Perrin's measurement of Avogadro's number.
  - **Copy link with these parameters** reopens the lab with the same set-up.
- **Data tab**: plot any column against any other (log axes, compare two runs, error bars for sweeps), least-squares fits (linear, proportional, quadratic, cubic, exponential, exponential + offset, power law, logarithmic, sinusoid, damped sinusoid, Gaussian) with standard errors, R², RMSE and derived quantities (half-life, period, Q …), statistics (N, mean, SD, SEM, min, max) and the full data table.
- **Exports**
  - **PDF report**: run details, snapshot of the simulation, all parameters, main plot with fit, statistics, a plot of every quantity, every data row, and the model equations. Written by a small built-in PDF writer (`js/pdf.js`).
  - **CSV** (with units in the header) and **JSON** (data + settings + parameters).

## Labs

| Area | Labs |
|---|---|
| Mechanics | Driven damped oscillator · Ballistics with drag · Double pendulum · N-body orbits · Fluid dynamics · Cloth |
| Waves & optics | Vibrating string · Ripple tank · Diffraction & interference · Ray optics bench |
| Thermodynamics & statistical | Heat conduction · Kinetic gas · Brownian motion & optical trap · Lennard-Jones matter · Ising model · Black-body radiation |
| Electricity & magnetism | RC / RL / RLC circuits · Point charges · Charged particles in E and B fields |
| Quantum & modern | Photoelectric effect · Radioactive decay · Schrödinger wave packets · Black hole geodesics |

New in this version: oscillator, circuits, diffraction, heat conduction, Brownian motion, black body, photoelectric effect and radioactive decay — all with real units and material/isotope data.

## Files

- `index.html`, `css/style.css` — page and plain light theme
- `js/core.js` — lab shell, controls registry, simulation clock, live log, plot helpers
- `js/experiment.js` — experiment runner, data tab, fitting, CSV/JSON/PDF export
- `js/pdf.js` — dependency-free PDF writer (Helvetica/Courier, vector lines, JPEG)
- `js/meta.js` — categories, descriptions and standard experiments of the original labs
- `js/labs/*.js` — one file per lab (`PhysLab.define({...})`)

All results are simulated. Each lab's Theory tab (and every report) lists the equations, numerical method and assumptions.
