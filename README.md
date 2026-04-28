# Atom Bonding Studio

A clean interactive chemistry explainer for watching atoms drift through space, collide, and form simplified covalent, ionic, and metallic bonds. The canvas shows atom motion, valence electrons, electron sharing, electron transfer, partial charges, ion charges, and a simplified metallic electron sea.

## Run

```powershell
npm run dev
```

Then open the local URL printed by Vite. The app is also built as static files with:

```powershell
npm run build
```

For Vercel, use the default settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

If `npm` is not on PATH in this local workspace, use the bundled static builder directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1
node .\scripts\serve-dist.mjs
```

## What is included

- Free Simulation mode for choosing atom types and letting them collide naturally.
- Guided Learning mode for H2, NaCl, water polarity, and metallic bonding walkthroughs.
- Preset Molecule mode for H2, O2, N2, H2O, CO2, CH4, NH3, NaCl, MgO, and a sodium metallic lattice.
- A real-time side panel with atomic number, valence electrons, electronegativity, bond count, electron configuration, bond type, plain explanation, deeper scientific explanation, and legend.
- Sliders for temperature, atom count, speed, collision strength, electronegativity emphasis, and bonding distance.

## Simplified bonding logic

This is an educational model, not a quantum chemistry engine. Atoms are particles with valence capacity, electronegativity, radius, and typical bond counts. When compatible atoms get close enough, the simulator classifies the bond:

- small electronegativity difference: nonpolar covalent
- moderate electronegativity difference: polar covalent
- large metal-nonmetal difference: ionic
- metal lattice preset: metallic bonding with delocalized electrons

Covalent bonds show shared electron pairs. Ionic bonds show electron transfer, ion charges, and attraction. Bond constraints then keep bonded atoms moving as a structure.

## Add more atoms or molecules

Add elements in `src/data/atoms.ts`, then add molecule layouts in `src/data/presets.ts`. If a new pair needs a specific single, double, or triple bond order, update the pair table in `src/simulation/chemistry.ts`.
