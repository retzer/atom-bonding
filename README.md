# Atom Bonding Studio

Atom Bonding Studio is an interactive chemistry simulator and learning workspace built with React 19, Vite 6, TypeScript, and Tailwind CSS. It combines a 2D bonding playground, 3D molecular visualization, a guided curriculum, a complete periodic table, PubChem import, cache-first AI chemistry notes, isotope-aware nuclear behavior, and a developing electron-first reaction system called **The Electron Engine**.

The project is designed to help learners move from simple atom models toward deeper chemical reasoning: shells, valence, bonding, geometry, polarity, composition, isotopes, reaction mechanisms, and electron flow.

## Highlights

- **Free Simulation**: spawn atoms, watch them drift, collide, repel, bond, relax, and form simplified structures.
- **Guided Learning**: 10 modules and 54 lessons with animation, recall prompts, quizzes, module assessment, and spaced review.
- **Preset Molecules**: curated covalent, ionic, metallic, organic, and resonance examples.
- **Chemistry Lab**: molecule import/search, composition analysis, bond inventory, functional groups, inspection, AI notes, and reaction tools.
- **Complete periodic table**: 118 elements with animated hover/inspection models and element details.
- **2D and 3D views**: Bohr, compact, probability-cloud, Rutherford, SPDF-style 2D models plus VSEPR-oriented 3D rendering.
- **The Electron Engine**: electron-source to electron-target reaction previews with curved arrows, bond-order changes, charge deltas, stability feedback, undo/redo, and timelines.
- **Isotope layer**: isotope metadata, proton/neutron editing, half-life display, time-scaled decay events, isotope labels, and Geiger-style feedback.
- **PubChem + DeepSeek integration**: PubChem-derived molecular metadata and cache-first DeepSeek V4 Flash chemistry notes through a local proxy.

## Status

This is an educational chemistry simulator, not a quantum-accurate molecular dynamics or universal reaction prediction engine. Deterministic local rules are the source of truth for molecule changes. AI output is advisory and cached; it explains chemistry but does not mutate structures.

Current implementation includes:

- 118-element table.
- 30+ molecule presets.
- 54 guided lessons across 10 modules.
- 2D/3D rendering and VSEPR geometry support.
- PubChem import and molecule metadata enrichment.
- Chemistry Lab composition analysis.
- Electron Engine v1 primitives and staged reaction-family registry.
- Isotope-aware inspection, decay visuals, and time-scaled nuclear events.

## Run Locally

```powershell
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

Build production files with:

```powershell
npm run build
```

Run the stricter local/static build path with:

```powershell
npm run build:local
```

Run unit tests with:

```powershell
npm run test:unit
```

## Optional AI Notes

Chemistry Lab can use a local DeepSeek proxy for AI chemistry notes:

```powershell
npm run chem-ai
```

Create a local `.env.local` file for secrets. Do not commit API keys.

```text
DEEPSEEK_API_KEY=your_key_here
```

AI notes are cache-first and stored locally so repeated molecule searches do not waste tokens.

## Project Structure

```text
src/
  App.tsx                         Root app shell and mode layout
  components/                     Canvas, 3D view, panels, controls, lesson UI
  data/                           Elements, isotopes, lessons, presets, PubChem helpers
  hooks/useSimulation.ts          Central simulation and UI state
  simulation/                     Chemistry, physics, VSEPR, reactions, isotopes
  types.ts                        Shared TypeScript model
docs/
  FORMAL_PROJECT_REPORT.md        Longer technical/project report
PROJECT_PROPOSAL.md               Proposal-ready project overview and roadmap
scripts/
  chem-ai-proxy.mjs               Local DeepSeek proxy
  build.ps1 / build.mjs           Local static build helpers
```

## Core Modes

### Free Simulation

A direct atom playground. Users choose elements, spawn atoms, inspect shells and charges, visualize bonds, change overlays, adjust time, and observe simplified bonding behavior.

### Guided Learning

A structured chemistry curriculum that builds from atoms to periodic patterns, valence, stability, bonding, polarity, VSEPR, intermolecular forces, reactions, organic chemistry, and real-world examples.

### Preset Molecules

A molecule browser with predefined structures for common covalent molecules, ionic compounds, metallic lattices, and advanced/organic structures.

### Chemistry Lab

A composition and reaction workspace. Users can import/search molecules, inspect molecular properties, review AI chemistry notes, view bond explanations, interact with reaction previews, and work with The Electron Engine.

## The Electron Engine

The Electron Engine is the named reaction/mechanism subsystem. Its direction is electron-first chemistry:

1. The user selects an electron source such as a lone pair, pi bond, sigma bond, radical, or charged region.
2. The user targets an atom, bond, proton site, antibonding site, or reaction region.
3. The simulator previews curved arrows, ghost bonds, breaking bonds, charge deltas, bond-order changes, hybridization changes, polarity shifts, and stability reasons.
4. The user commits the step.
5. The molecule graph, inspection, analysis, AI cache keys, and timeline update together.

The current engine implements a v1 foundation and staged reaction families. It is intentionally deterministic and local; AI is explanatory, not authoritative.

## Isotopes And Time

The simulator includes a global time multiplier from 1x to 1000x. User-facing time is scaled simulation time. Isotope decay uses the same clock:

```text
p = 1 - exp(-(ln 2 / halfLifeSeconds) * dt)
```

Stable isotopes do not decay. Source-backed radioactive isotopes can produce nuclear events. Source-missing estimated isotopes are displayed conservatively and do not invent decay chains.

## Documentation

- [Project proposal](PROJECT_PROPOSAL.md)
- [Formal project report](docs/FORMAL_PROJECT_REPORT.md)

These documents describe the architecture, milestones, current limitations, and long-term roadmap including organic, biochemical, inorganic, electrochemical, quantum visualization, and guided mechanism-learning expansions.

## Deployment

For Vercel:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Known Limits

- Chemistry and nuclear behavior are educational approximations unless backed by explicit data records.
- The isotope table currently combines curated/source-ready records with conservative local defaults; a full vendored ENSDF/IAEA dataset is the next step for exhaustive nuclide coverage.
- The Electron Engine is a mechanism foundation, not a complete named-reaction oracle.
- 3D rendering is a custom educational visualization layer, not a full molecular mechanics package.

## License

No license has been selected yet. Add a license before broad public reuse.
