# Molecule Lab

An interactive chemistry playground in a single HTML file (no build step, no dependencies).

Open `index.html` in a browser, or serve this folder with GitHub Pages.

## What it does

- **Molecule builder**: place atoms from all 118 elements, bond them (single, double, triple), drag to grow molecules, add functional groups, undo, zoom and pan, and work on several tables at once.
- **Built for big scenes**: a spatial-grid physics engine, viewport culling, level-of-detail drawing, physics that goes to sleep once a table settles, a frame-time governor that lowers quality automatically on slow machines, and memory-capped undo. A detailed table is capped at 150,000 atoms.
- **Crowd tables** (`🌐 New Crowd`, or pick an amount like ×100k / ×1M next to the library): huge numbers of molecules as lightweight particles stored in typed arrays. Polar and nonpolar species separate (oil and water), and zooming in shows the real molecule shapes. The cap adapts to the device's memory (up to 10 million).
- **Tools dock** (`🧰 Tools`, or Alt+T): a notepad that saves in your browser, a scientific calculator (no `eval`), chemistry tools (molar mass from a formula, mole / concentration / dilution / pH / ideal-gas solvers, element lookup) and a unit converter.
- **Library and search**: about 52,000 molecules searchable by name, synonym, formula, CAS number or SMILES. The database is embedded in the page (gzip + base64) and decoded in the browser, so no server or API is needed.
- **Live info**: formula, molar mass, mass composition, ring count, unsaturation, H-bond donors and acceptors, polarity, and build challenges.
- **Polarity mode**: polar molecules attract each other and hydrogen bonds are drawn (a simplified 2D model, not a real simulation).
- **DNA Lab**: 3D double helix, GC content, melting temperature, mass, restriction sites, translation to protein, and mutation analysis (silent, missense, nonsense, frameshift).
- **Cell division**: controllable mitosis and meiosis animations with hover labels.
- **Genetics**: a simplified trait model with an avatar.
- **Languages**: German and Turkish are built in. Other languages use optional Claude translation when the page is run inside Claude.

## Data

The molecule database was built from the identifier tables of the open-source
[`chemicals`](https://github.com/CalebBell/chemicals) Python package, whose data derives from PubChem.
Structures were kept only where the parsed formula matched the formula on record. It is not an authoritative
chemical database: salts, mixtures, charged species and very large molecules (above about 130 heavy atoms) are left out.

## Performance (measured)

Measured in headless Chromium with software rendering, so a real GPU machine should do better. Your own device may differ.

| Scene | Result |
| --- | --- |
| Detailed table, 90,000 atoms | draw about 3 ms per frame; one physics step about 75 ms, so physics runs every few frames |
| Crowd, 2.2 million molecules | about 55 fps, drawing a 20% sample when zoomed out |
| Crowd, 10 million molecules (the cap) | about 32 fps, drawing about 1% of particles when zoomed out; quality drops automatically |

At very high counts the crowd physics updates a slice of the particles each frame, so motion looks slower and zoomed-out views show a sample of the particles (the on-screen label says what percentage). Crowd molecules are particles, not individual atoms; the detailed table is where you build and edit real structures.

## Limits

- Crowd tables hold up to 12 different molecules and have no per-molecule editing or undo (use Clear or remove a species).
- The 2D layout is automatic; large molecules can look crowded. Zoom in and drag atoms apart.
- The "Ask Claude" button and non-built-in language translation only work when the page is opened through Claude.
- The SMILES reader accepts Kekulé notation only (no lowercase aromatic atoms, no charges, no stereochemistry).
