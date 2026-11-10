# Molecule Lab

An interactive chemistry playground in a single HTML file (no build step, no dependencies).

Open `index.html` in a browser, or serve this folder with GitHub Pages.

## What it does

- **Molecule builder**: place atoms from all 118 elements, bond them (single, double, triple), drag to grow molecules, add functional groups, undo, zoom and pan, and work on several tables at once.
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

## Limits

- The 2D layout is automatic; large molecules can look crowded. Zoom in and drag atoms apart.
- The "Ask Claude" button and non-built-in language translation only work when the page is opened through Claude.
- The SMILES reader accepts Kekulé notation only (no lowercase aromatic atoms, no charges, no stereochemistry).
