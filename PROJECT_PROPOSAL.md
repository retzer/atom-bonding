# Atom Bonding Studio + The Electron Engine

## Executive Summary

Atom Bonding Studio is an interactive chemistry education and simulation platform built with React 19, Vite 6, TypeScript, and Tailwind CSS. The project combines atom-level interaction, molecular visualization, guided curriculum, PubChem import, cache-first AI chemistry notes, and a developing electron-first reaction system named **The Electron Engine**.

The long-term vision is a rigorous chemistry simulator that helps students, educators, and advanced learners move from "atoms stick together" to "electrons move, bonds change, geometry responds, and chemical behavior follows." The system is not intended to claim quantum-accurate prediction in its current form. Instead, it uses deterministic local chemistry rules for molecule changes, qualitative stability and geometry feedback, and AI-generated explanation as an advisory layer.

Current implemented scope includes:

- Four app modes: Free Simulation, Guided Learning, Preset Molecules, and Chemistry Lab.
- A full 118-element periodic table with element inspection and animated atom models.
- 32 molecule presets covering covalent molecules, ionic compounds, metallic lattices, and organic/resonance examples.
- 54 guided lessons across 10 chemistry learning modules.
- 2D simulation and 3D molecular/VSEPR visualization.
- PubChem search/import for molecule structures and metadata.
- DeepSeek V4 Flash chemistry notes with local caching to avoid repeated AI calls.
- Chemistry Lab composition analysis, bonding explanation, inspection, and reaction preview tools.
- The Electron Engine v1 foundation for electron-first reaction previews, curved-arrow overlays, formal charge deltas, bond order changes, stability feedback, undo/redo, and reaction timeline work.

## Problem And Opportunity

Most chemistry learning tools separate concepts that are naturally connected. A learner may see a periodic table in one place, molecule structures in another, reaction mechanisms in a textbook, and property data in a database. The gap between these surfaces is where chemistry often becomes abstract and fragmented.

Atom Bonding Studio addresses that gap by presenting chemistry as an interactive system:

- Elements are not just symbols; they have shells, valence behavior, charge, isotopic context, and periodic patterns.
- Molecules are not just static drawings; they have bond inventories, geometry, polarity, functional groups, and composition.
- Reactions are not just memorized names; they arise from electron sources moving toward electron targets.
- Learning is not just passive reading; it includes guided animation, recall prompts, quizzes, module assessment, and repeated concept exposure.

The opportunity is to build a chemistry workspace that is both accessible to middle/high-school learners and expandable toward college-level and professional reasoning.

## Product Vision

The product vision is a fully fledged chemistry simulator with three connected layers:

1. **Visual layer** - atoms, shells, bonds, lone pairs, geometry, polarity, electron flow, reaction centers, and offscreen labels.
2. **Chemistry reasoning layer** - valence rules, VSEPR, bond classification, formal charges, functional groups, composition, stability scoring, and deterministic reaction previews.
3. **Learning and explanation layer** - guided lessons, active recall, module assessments, AI-assisted notes, molecule interpretation, and future mechanism tutoring.

The simulator should eventually support a learner journey such as:

1. Click an element and see its atom model.
2. Build or import a molecule.
3. Inspect formula, molar mass, percent composition, geometry, polarity, and functional groups.
4. Select an electron pair, drag it toward a target, preview the reaction consequence, and commit the step.
5. Watch the molecule update: bonds, charges, geometry, hybridization, stability, and explanation all refresh together.
6. Replay the mechanism path and compare alternate pathways.

## Current Implemented Capabilities

### Free Simulation

Free Simulation is the interactive atom playground. Users spawn atoms, observe motion, collisions, bond formation, bond breaking, molecular relaxation, charge behavior, and 2D visual overlays. The simulator supports direct manipulation patterns such as selecting atoms/bonds, inspecting structures, and visualizing chemistry-relevant labels.

The simulation is qualitative and educational. Its goal is to make bonding behavior legible, not to replace molecular dynamics or quantum chemistry software.

### Guided Learning

Guided Learning contains 54 lessons across 10 modules:

1. The Atom
2. Periodic Table
3. Octet and Configuration
4. Chemical Bonds
5. Electronegativity
6. VSEPR Geometry
7. Intermolecular Forces
8. Reactions and Energy
9. Organic Chemistry
10. Real-World Chemistry

The curriculum has been reframed around a concept spine:

`atoms -> electrons/valence -> periodic patterns -> stability -> bonding -> polarity/shape -> intermolecular forces -> reactions -> organic/real-world chemistry`

Learning surfaces include lesson goals, prerequisite recaps, key ideas, common mistakes, recall prompts, quizzes, module summaries, and assessments. The design favors active recall and spaced repetition while avoiding hard-blocking progress.

### Preset Molecules

The app includes 32 molecule presets. These provide fast access to common and instructive structures such as H2, H2O, CO2, CH4, NH3, NaCl, benzene, ethanol, formaldehyde, acetic acid, acetone, glucose, and metallic lattices. Presets serve as demonstration objects for bonding, geometry, polarity, functional groups, and composition.

### Chemistry Lab

Chemistry Lab is the molecule-analysis workspace. It reduces simulator clutter and emphasizes chemical interpretation:

- PubChem search/import.
- Formula and atom counts.
- Molar mass and percent composition.
- Bond inventory, bond order, and bond type counts.
- Functional group detection.
- Ring and heteroatom summaries.
- VSEPR highlights.
- Lone pair and polarity summaries.
- PubChem properties such as CID, molecular weight, exact mass, SMILES/InChI, XLogP, TPSA, donors/acceptors, rotatable bonds, formal charge, and complexity when available.
- AI chemistry notes under the viewport.
- Inspection panels synchronized with selected atoms, bonds, and molecule-level structure.

PubChem-derived values are treated as sourced external metadata. Local analysis still works when PubChem data is missing.

### Periodic Table And Element Inspection

The project includes a full 118-element periodic table. Element data supports periodic placement, group/category styling, mass, shell distribution, electron configuration, valence behavior, discovery information, descriptions, radioactivity metadata, and animated hover/inspection surfaces.

Element inspection can show atom-level information such as atomic number, valence electrons, electronegativity, electron configuration, shell distribution, stability cues, radioactivity information, and concise summaries.

### 2D And 3D Molecular Visualization

The app supports both 2D canvas visualization and 3D molecular/VSEPR rendering. The visual system includes:

- Atom rendering with shells/electrons.
- Bond labels and bond order labels.
- Lone pairs in 2D and 3D.
- Polarity and dipole overlays.
- VSEPR geometry placement.
- Flexible and rigid motion modes.
- Focus and inspection behavior.
- Reaction overlays shared between 2D and 3D where applicable.

The 3D system is a visualization and learning model. It should clearly disclose simplified geometry where the visual model cannot yet represent a chemically precise structure.

## The Electron Engine

**The Electron Engine** is the named mechanism subsystem for Atom Bonding Studio. Its core idea is:

> Users manipulate electrons; the system explains chemical consequences.

Instead of treating reactions as buttons that magically transform molecules, The Electron Engine models chemistry around electron sources and electron targets.

### Electron Sources

Electron sources may include:

- Lone pairs.
- Pi bonds.
- Sigma bonds.
- Radical electrons.
- Formal negative charge centers.
- Resonance-capable or conjugated regions.

### Electron Targets

Electron targets may include:

- Electrophilic atoms.
- Proton sites.
- Bonds that can break.
- Antibonding/break sites.
- Positive charge centers.
- Group-selected reaction regions.

### Mechanism Preview

Before committing a step, The Electron Engine can preview:

- Ghost forming bonds.
- Dashed breaking bonds.
- Curved electron-flow arrows.
- Bond-order deltas.
- Formal-charge deltas.
- Hybridization updates.
- Octet/duet reasons.
- Polarity changes.
- Stability and strain reasons.
- Blocked-action messages when a proposed move violates local rules.

### Deterministic Source Of Truth

The Electron Engine is deterministic and local. DeepSeek can explain previews and committed steps, but it does not mutate molecule state. Molecule changes are made only by local rule modules.

### Current V1 Scope

The v1 foundation is focused on electron-first primitives and fundamental reaction behavior:

- Bond formation and bond breaking.
- Single/double/triple bond order changes.
- Protonation and deprotonation.
- Electron transfer and proton transfer foundations.
- Nucleophilic/electrophilic source-to-target interactions.
- Resonance shift foundations.
- Reaction previews.
- Reaction scoring.
- Formal charge and stability feedback.
- Undo/redo and reaction timeline design.

The Electron Engine is not yet a universal reaction prediction system. Named reaction families are staged as future expansions built on these primitives.

## Technical Architecture

### Frontend Platform

- React 19 for component UI.
- Vite 6 for local development and production builds.
- TypeScript for strict data and simulation typing.
- Tailwind CSS and custom CSS for visual styling.
- Canvas/WebGL-style rendering surfaces for 2D and 3D visualization.

### Core Data

- `src/data/periodicTable.ts` - complete 118-element periodic table data.
- `src/data/atoms.ts` - atom definitions used by simulation and rendering.
- `src/data/elementDetails.ts` - element descriptions, discovery information, and inspection details.
- `src/data/radioactivity.ts` - radioactivity and half-life-related metadata.
- `src/data/presets.ts` - 32 molecule presets.
- `src/data/lessons.ts` - guided lesson content and animation definitions.
- `src/data/learningFramework.ts` - concept registry, objectives, recall prompts, bridges, module summaries, and assessment scaffolding.
- `src/data/pubchem.ts` - PubChem REST integration.
- `src/data/chemAi.ts` - DeepSeek AI note integration and caching.

### Simulation And Chemistry

- `src/simulation/engine.ts` - atom movement, collision, bonding, and core simulation loop.
- `src/simulation/chemistry.ts` - bond classification, valence behavior, and chemistry helpers.
- `src/simulation/vsepr.ts` and `src/simulation/vsepr3d.ts` - VSEPR geometry analysis and 3D placement.
- `src/simulation/relaxation.ts` - molecular relaxation and force-like visual settling.
- `src/simulation/functionalGroups.ts` - functional group detection.
- `src/simulation/moleculeAnalysis.ts` - formula, mass, composition, bond inventory, polarity, and structure analysis.
- `src/simulation/reactions.ts` - deterministic reaction primitives and scoring.
- `src/simulation/electronMechanism.ts` - electron-first mechanism preview and commit layer.
- `src/simulation/reactionRegistry.ts` - staged reaction-family registry.

### Components

- `src/App.tsx` - root layout and app mode orchestration.
- `src/components/SimulationCanvas.tsx` - 2D canvas rendering.
- `src/components/Molecule3DView.tsx` - 3D molecular rendering.
- `src/components/LearningPanel.tsx` - guided curriculum, recall, quizzes, and assessments.
- `src/components/LessonOverlay.tsx` - guided lesson animation overlays.
- Chemistry Lab panels - molecule analysis, AI notes, inspection, reaction builder, and reaction timeline surfaces.

## Milestones To Date

### Milestone 1 - Interactive Atom Bonding Simulation

The project began as an atom-level simulator where atoms drift, collide, and form visible bonds. This established the physical interaction model, visual atom representation, bond classification, and early educational behavior.

### Milestone 2 - Complete Periodic Table And Element Inspection

The project expanded from a limited atom picker into a full 118-element periodic table with richer metadata, animated atom previews, shell/electron views, element discovery data, radioactivity indicators, and inspection details.

### Milestone 3 - Guided Learning Curriculum Reframe

Guided Learning was reworked from a set of fragmented lessons into a 10-module curriculum with scaffolding, objectives, recall prompts, module assessments, spaced repetition, and clearer concept progression.

### Milestone 4 - 3D Molecular Visualization And VSEPR Geometry

The visualization system added VSEPR-aware geometry analysis, 3D molecular rendering, lone pairs, bond overlays, molecular relaxation, and 2D/3D switching.

### Milestone 5 - Chemistry Lab, PubChem, And AI-Assisted Interpretation

Chemistry Lab introduced molecule-level analysis: formula, molar mass, percent composition, bond inventory, functional groups, PubChem enrichment, and DeepSeek AI chemistry notes with local caching.

### Milestone 6 - The Electron Engine V1

The Electron Engine establishes the electron-first foundation: electron sources, electron targets, previews, curved arrows, formal charge changes, bond order updates, hybridization feedback, stability reasons, reaction timeline, and undo/redo design.

## Roadmap

The roadmap is intentionally ambitious, but staged. Expansions should build on deterministic local chemistry primitives before adding named reaction families at scale.

### Expansion 1 - Fundamental Reactions

- Protonation.
- Deprotonation.
- Bond formation.
- Bond breaking.
- Single/double/triple bond order change.
- Electron transfer.
- Proton transfer.
- Nucleophilic attack.
- Electrophilic attack.
- Resonance shift.
- Tautomerization.
- Hydration.
- Dehydration.
- Hydrolysis.
- Condensation.
- Oxidation.
- Reduction.

### Expansion 2 - Organic Chemistry Essentials

- Substitution (SN1).
- Substitution (SN2).
- Elimination (E1).
- Elimination (E2).
- Addition reaction.
- Esterification.
- Amidation.
- Hydrogenation.
- Halogenation.
- Nitration.
- Alkylation.
- Acylation.
- Cyclization.
- Ring opening.
- Rearrangement.
- Keto-enol tautomerization.

### Expansion 3 - Bonding And Electron Mechanics

- Curved arrow electron flow.
- Homolytic cleavage.
- Heterolytic cleavage.
- Radical formation.
- Radical substitution.
- Radical addition.
- Resonance delocalization.
- Conjugation.
- Aromatic substitution.
- Aromatic addition.
- Hybridization change.
- Dipole redistribution.

### Expansion 4 - Advanced Organic Reactions

- Aldol condensation.
- Claisen condensation.
- Michael addition.
- Grignard addition.
- Diels-Alder cycloaddition.
- Wittig reaction.
- Friedel-Crafts alkylation.
- Friedel-Crafts acylation.
- Hydroboration-oxidation.
- Oxymercuration-demercuration.
- Epoxidation.
- Ozonolysis.
- Reductive amination.
- Acetal formation.
- Hemiacetal formation.

### Expansion 5 - Polymer And Material Chemistry

- Addition polymerization.
- Condensation polymerization.
- Chain initiation.
- Chain propagation.
- Chain termination.
- Cross-linking.
- Depolymerization.
- Crystallization.
- Phase transition.
- Adsorption/desorption.

### Expansion 6 - Biochemistry

- Peptide bond formation.
- Peptide hydrolysis.
- Glycosidic bond formation.
- Phosphorylation.
- Dephosphorylation.
- ATP hydrolysis.
- Enzyme catalysis.
- Fermentation.
- DNA base pairing.
- Denaturation.
- Transamination.
- Methylation.

### Expansion 7 - Inorganic And Coordination Chemistry

- Ligand substitution.
- Coordination complex formation.
- Chelation.
- Oxidative addition.
- Reductive elimination.
- Transmetallation.
- C-H activation.
- Complex dissociation.
- Ionization.
- Precipitation reaction.

### Expansion 8 - Electrochemistry And Energy

- Redox reaction.
- Electrolysis.
- Galvanic cell reaction.
- Proton-coupled electron transfer.
- Oxidative phosphorylation.
- Combustion.
- Catalytic cracking.
- Hydroformylation.
- Catalytic hydrogenation.

### Expansion 9 - Quantum / Advanced Visualization

- Molecular orbital interaction.
- Orbital hybridization visualization.
- Electron density mapping.
- HOMO/LUMO interaction.
- Transition state visualization.
- Reaction coordinate diagram.
- Energy surface mapping.
- Dipole field visualization.
- Resonance contributors.
- Conformational rotation.

### Expansion 10 - Educational / Guided Learning

- Step-by-step mechanism mode.
- Guided electron pushing.
- Reaction quizzes.
- Stability prediction.
- Polarity prediction.
- Geometry prediction.
- Octet validation.
- Reaction pathway replay.
- AI explanation mode.
- Compare molecule mode.

## Beyond Expansion 10

Beyond the first 10 expansions, Atom Bonding Studio can evolve into a modular chemistry research and education platform:

- Isotope and time modeling with user-editable proton/neutron counts, radioisotope decay, half-life simulation, daughter products, and time multipliers.
- Reaction-coordinate visualization showing energy profiles, transition states, intermediates, and relative stability.
- Validation datasets from curated educational examples, PubChem structures, known reaction fixtures, and classroom assessment results.
- Classroom mode with teacher-authored lessons, assignments, progress export, and guided assessment.
- Lab mode for structured molecule building, reaction replay, mechanism comparison, and report generation.
- AI tutoring that can explain a molecule, reaction step, mistake, or alternate pathway without taking control of molecule mutation.
- Mechanism replay and branching pathways so learners can compare resonance, proton transfer, nucleophilic attack, and product formation choices.
- Comparative molecule workspaces for polarity, solubility, functional groups, geometry, and reactivity.
- Modular chemistry-domain engines for organic, inorganic, biochemistry, materials, electrochemistry, and spectroscopy-like visualization.
- Long-term integration with external scientific datasets while preserving transparent local rule explanations.

## Validation And Testing Status

The project includes a growing verification strategy:

- TypeScript type checks for strict data and component consistency.
- Production and local build checks.
- Unit tests for reaction and electron mechanism behavior.
- Manual visual checks for 2D/3D rendering, Guided Learning animations, Chemistry Lab analysis, PubChem imports, AI cache behavior, and reaction overlays.

Important validation rules:

- Local deterministic chemistry rules are the source of truth for molecule changes.
- DeepSeek is advisory and cache-first; it explains chemistry but does not mutate structures.
- PubChem metadata is labeled as external source data.
- The app should distinguish educational qualitative models from research-grade computational chemistry.

## Known Limits

Current limitations are part of the proposal's integrity:

- The simulation is not quantum-accurate.
- The Electron Engine v1 is not a complete universal reaction predictor.
- Named reaction families beyond the fundamental primitives are staged roadmap items.
- Some geometry and hybridization displays are simplified for visualization.
- PubChem import quality depends on available external structure and metadata.
- AI notes can improve explanation, but local deterministic rules must remain authoritative.

## Why This Project Matters

Chemistry becomes powerful when learners can connect structure, motion, electrons, and explanation. Atom Bonding Studio aims to make that connection visible. It begins with simple atoms and bonds, then grows into a system where students can inspect, build, manipulate, question, and replay chemistry.

The Electron Engine is the key step toward that future: a reaction model where the user does not merely choose a reaction name, but sees the electron movement that makes chemistry happen.
