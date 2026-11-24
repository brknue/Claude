# Simple Mol Lab

A plain, measurement-focused copy of [Molecule Lab](../molecule-lab/): the same molecule builder, gas lab, crowd tables, DNA lab and tools, with a simpler look, data you can export and a new **Analysis Lab** of quantitative chemistry instruments. Every experiment can be downloaded as a PDF report with all data points. Runs in the browser on phones, tablets and computers; no server, no fonts or trackers, nothing is uploaded.

Open: https://brknue.github.io/Claude/simple-mol-lab/

## What is different from Molecule Lab

- **Plain look**: flat surfaces, one accent colour, no gradients, shadows or decorative emoji (`plain.css`, plus a small text pass in `tools.js`).
- **PDF reports everywhere**
  - *Molecule builder*: "PDF report of this table" — formula, name, all computed properties, a picture of the structure, atom count, atom and bond tables.
  - *Gas lab table*: new **Measure** box — record a time series (duration and sample interval in model time) or sweep the heat, piston load or gravity (settle, then mean ± SD over a measuring window). Report: set-up, plot with optional fit, statistics, all quantities, every row, the model. CSV export too.
  - *DNA workbench*: "PDF report" collects every workbench tab (overview, protein, codons, restriction and gel, alignment, primers) with their charts and the full sequence.
- **Analysis Lab** (new tab), four instruments, each with standard experiments, replicates, optional instrument noise, plots of any column against any other, least-squares fits with standard errors (linear … damped sinusoid, Gaussian), statistics, data table and PDF / CSV / JSON export:
  - **Acid–base titration**: exact charge-balance pH for strong, weak and polyprotic acids and bases (acetic, formic, benzoic, phosphoric, citric, carbonic, ammonium, ammonia, carbonate) with NaOH or HCl; finds equivalence points from the measured curve, pKₐ at half equivalence and the analyte concentration.
  - **Reaction kinetics**: zero-, first- and second-order rate laws with the Arrhenius equation (N₂O₅ decomposition with literature A and Eₐ, plus practice reactions); ln k vs 1/T plots give Eₐ.
  - **UV-Vis spectrophotometer**: Beer–Lambert law with literature ε (KMnO₄, crystal violet, methylene blue, CuSO₄, K₂Cr₂O₇, NADH), stray light, spectra scans, calibration curves and unknown samples measured against your calibration.
  - **Real gases**: van der Waals isotherms for nine gases, compressibility factor, critical constants, Boyle temperature.

Molecule Lab itself is unchanged.

## Files

- `index.html` — copy of Molecule Lab (with the molecule database embedded), new tab and script includes
- `plain.css` — the plain look and the styles of the additions
- `pdf.js` — dependency-free PDF writer (shared with Physica)
- `tools.js` — statistics, fitting, plots, generic PDF report builder, plain-text pass
- `reports.js` — PDF reports and measurement runs for the builder, gas lab and DNA workbench
- `analysis.js` — the Analysis Lab instruments

## Limits

The gas lab works in model units (temperature also on a rough kelvin scale). Analysis Lab results come from the stated models plus optional simulated noise; activity coefficients are 1, spectra use Gaussian band shapes, and the van der Waals loop below T_c is not corrected by a Maxwell construction. Everything in a report is computed or simulated, and each report says so.
