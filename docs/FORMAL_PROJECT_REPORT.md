# Formal Project Report: Atom Bonding Studio + The Electron Engine

## Abstract

Atom Bonding Studio is an interactive chemistry simulator and learning platform built with React 19, Vite 6, TypeScript, and Tailwind CSS. The project currently combines four app modes: Free Simulation, Guided Learning, Preset Molecules, and Chemistry Lab. It includes a full 118-element periodic table, 32 molecule presets, 54 guided lessons, 2D and 3D molecular rendering, VSEPR geometry analysis, PubChem import, DeepSeek V4 Flash AI chemistry notes with local caching, and deterministic local reaction preview tooling.

The next major technical identity of the project is **The Electron Engine**, an electron-first reaction mechanism subsystem. The Electron Engine reframes reaction interaction from operation buttons to electron manipulation: users select or drag electron sources toward targets, preview curved-arrow electron movement, inspect formal charge and bond-order consequences, then commit or cancel a step. This report documents the implemented system, current limits, milestone history, validation approach, and roadmap toward a rigorous chemistry simulator.

## Background And Motivation

Chemistry instruction often asks learners to jump between disconnected representations:

- Periodic tables.
- Static molecule diagrams.
- Ball-and-stick models.
- Lewis structures.
- Reaction equations.
- Mechanism arrows.
- Property databases.
- Concept quizzes.

Each representation is useful, but the transitions between them can be difficult. A learner may know that oxygen has six valence electrons, but not see how that connects to lone pairs, bent water geometry, polarity, hydrogen bonding, boiling point, and reaction behavior.

Atom Bonding Studio is motivated by the idea that chemistry is best learned as a connected visual system. The platform aims to show how atomic identity, electron structure, bonding, shape, polarity, composition, and reactivity reinforce one another.

The project is designed for a broad learning arc:

- Middle-school learners can start with atoms, protons, electrons, shells, and simple bonds.
- High-school learners can explore valence, periodic trends, VSEPR, polarity, intermolecular forces, and reactions.
- College learners can connect electron configurations, functional groups, mechanisms, resonance, hybridization, and stability.
- Advanced users can eventually use the system as a qualitative reaction and molecule reasoning workspace.

## System Overview

Atom Bonding Studio currently consists of four major modes.

### Free Simulation

Free Simulation is the primary interactive atom canvas. Users can spawn atoms, observe motion, collision, bonding, and structure formation. The simulation includes 2D rendering, bond labels, atom inspection, zoom, visual overlays, flexible/rigid behavior, and chemistry feedback.

### Guided Learning

Guided Learning contains 54 lessons organized into 10 modules. It uses lesson animations, lesson goals, recap cards, key ideas, common mistakes, recall prompts, quizzes, module summaries, and module assessments. The curriculum is arranged to reduce conceptual fragmentation and strengthen active recall.

### Preset Molecules

Preset Molecules provides 32 predefined structures across simple covalent molecules, ionic compounds, metallic lattices, organic compounds, resonance examples, and larger structures. Presets help users quickly explore known molecules without building them from scratch.

### Chemistry Lab

Chemistry Lab is a molecule-analysis workspace. It supports PubChem import, local molecule analysis, AI chemistry notes, inspection, bonding explanation, reaction previews, and synchronized panels. Chemistry Lab is the home for The Electron Engine.

## Technical Architecture

### Platform Stack

The application uses:

- React 19 for UI.
- Vite 6 for development and production bundling.
- TypeScript for structured chemistry and UI state.
- Tailwind CSS and custom CSS for styling.
- Canvas/WebGL-style rendering for simulation and molecular visualization.
- Vitest for unit testing reaction and electron-mechanism modules.

### Data Architecture

The project separates data by chemistry domain:

- Periodic element data.
- Atom simulation definitions.
- Element descriptions and discovery metadata.
- Radioactivity metadata.
- Molecule presets.
- Guided lesson sequences.
- Curriculum framework metadata.
- PubChem integration.
- DeepSeek AI cache integration.

This separation matters because the project has grown beyond a single simulator. The system now supports education, visualization, molecule analysis, reaction previews, and AI explanations.

### Simulation Architecture

The simulation layer includes:

- Atom movement and collision handling.
- Bond formation and breaking.
- Covalent, ionic, and metallic bond classification.
- Valence capacity checks.
- Molecular relaxation.
- Bond springs, angle forces, and nonbonded repulsion.
- VSEPR analysis and geometry placement.
- Functional group detection.
- Molecule composition analysis.

The model is intentionally qualitative. It is designed to be chemically informative and visually understandable, not to reproduce quantum chemistry or molecular dynamics calculations.

### Rendering Architecture

The visual layer supports both 2D and 3D views:

- 2D canvas atom and molecule rendering.
- 3D molecular and VSEPR visualization.
- Electron shell models.
- Probability cloud and atomic model variants.
- SPDF shell-oriented display modes.
- Lone pairs.
- Bond type and bond order labels.
- Dipoles and polarity overlays.
- Radioactivity indicators.
- Reaction preview overlays.
- Highlight synchronization between viewport, Chemistry Lab panels, and reaction timeline.

The design direction is to keep 2D and 3D connected through shared overlay payloads so reaction centers, curved arrows, ghost bonds, breaking bonds, and selected atoms can be represented consistently.

## Simulation Model And Limits

Atom Bonding Studio uses local chemistry rules to create an educational simulation. Its models include:

- Valence-based bond capacity.
- Electronegativity-based bond classification.
- VSEPR-based geometry hints.
- Functional group rule detection.
- Formula and molar mass calculation.
- Percent composition.
- Qualitative polarity and stability scoring.
- Reaction preview validation.

The project should not be described as:

- Quantum-accurate.
- A replacement for computational chemistry packages.
- A complete reaction prediction system.
- A complete named-reaction engine.
- A validated thermodynamic or kinetic calculator.

Instead, it should be described as a transparent, deterministic, educational chemistry reasoning simulator whose current rules are intended to be understandable and inspectable.

## Guided Learning Pedagogy

Guided Learning was reframed around a concept spine:

`atoms -> electrons/valence -> periodic patterns -> stability -> bonding -> polarity/shape -> intermolecular forces -> reactions -> organic/real-world chemistry`

### Curriculum Framework

The curriculum layer includes:

- Concept identifiers.
- Learning objectives.
- Recall prompts.
- Lesson bridges.
- Module summaries.
- Common misconceptions.
- Concept progress tracking.
- Quiz metadata.

This makes the lesson system more maintainable than scattering study notes directly through UI components.

### Learning Surfaces

Each lesson may surface:

- Before-this-lesson recap.
- Today's goal.
- Key idea.
- Common mistake.
- Concept tags.
- Try-recalling prompt.
- Lesson quiz.
- Module assessment.

These surfaces aim to create enough rigor without overwhelming the learner at the beginning.

### Spaced Repetition And Active Recall

The recall and assessment strategy is designed around:

- Current-topic alignment.
- Previously taught prerequisite review.
- Multiple variants for core concepts.
- Retry reshuffling.
- Local concept progress storage.
- Gentle review rather than hard mastery blocking.

The intended result is a guided learning experience that builds memory and conceptual fluency over time.

## Chemistry Lab And PubChem/AI Integration

Chemistry Lab converts the app from a simulator into a molecule interpretation workspace.

### Local Computed Analysis

Local analysis includes:

- Molecular formula.
- Atom counts.
- Molar mass.
- Percent composition.
- Bond inventory.
- Bond order counts.
- Bond type counts.
- Functional group summary.
- Ring and heteroatom summary.
- Polarity estimate.
- VSEPR highlights.
- Lone pair summary.
- Stability and geometry cues.

### PubChem Integration

PubChem import can provide structure and compound metadata. Fields may include:

- CID.
- IUPAC name.
- Synonyms.
- Canonical SMILES.
- Isomeric SMILES.
- InChI.
- InChIKey.
- Molecular formula.
- Molecular weight.
- Exact mass.
- XLogP.
- TPSA.
- H-bond donors.
- H-bond acceptors.
- Rotatable bonds.
- Formal charge.
- Complexity.

PubChem-derived data should be clearly labeled. Local composition and bonding analysis should remain available even when PubChem fields are missing.

### DeepSeek AI Notes

DeepSeek V4 Flash is used for chemistry notes and explanation. It is cache-first:

- Molecule snapshots are cached locally.
- Repeated molecules should reuse previous responses.
- AI notes can summarize structure, functional groups, polarity, and caveats.
- AI may explain selected atoms, bonds, previews, or committed reaction steps.

DeepSeek is advisory only. It does not mutate molecule structures. Local deterministic rules remain the source of truth for molecule changes.

## The Electron Engine Technical Model

The Electron Engine is the electron-first mechanism subsystem for Chemistry Lab.

### Core Design Principle

The target interaction model is:

`electron source -> electron target -> preview consequences -> commit step -> update molecule and explanation`

This replaces a purely toolbar-driven model where the user selects an operation and the system directly applies it.

### Electron Sources

Supported and staged electron sources include:

- Lone pairs.
- Pi bonds.
- Sigma bonds.
- Radical electrons.
- Formal charges.
- Conjugated or resonance-capable regions.

### Electron Targets

Supported and staged targets include:

- Electrophilic atoms.
- Proton sites.
- Bond break sites.
- Antibonding regions.
- Positive charge centers.
- Multi-atom selected regions.

### Mechanism Preview

A preview should be chemically informative before the graph changes. It can contain:

- Curved-arrow electron flow.
- Ghost forming bonds.
- Dashed breaking bonds.
- Formal-charge deltas.
- Bond-order deltas.
- Hybridization deltas.
- Octet or duet validation.
- Polarity changes.
- Stability reasons.
- Strain reasons.
- Blocked-action warnings.

Preview is especially important because it lets users learn cause and effect before committing a reaction step.

### Commit Model

Committed steps update:

- Atom and bond graph.
- Bond orders.
- Formal charges.
- Local geometry.
- VSEPR summaries.
- Lone-pair counts.
- Polarity summaries.
- Functional group detection.
- Molecule analysis.
- Inspection panels.
- AI cache keys.
- Reaction timeline.

Undo/redo is designed around graph snapshots so the user can explore mechanisms without losing a previous state.

### Reaction Timeline

The timeline records step-by-step reaction history:

- Step number.
- Action or gesture summary.
- Affected atoms and bonds.
- Before/after formula.
- Score delta.
- Stability reasons.
- Explanation.
- Timestamp.

The timeline is intended to support mechanism replay, classroom explanation, and future pathway comparison.

## Milestone History

### Milestone 1 - Interactive Atom Bonding Simulation

The project established a 2D simulation canvas where atoms could drift, collide, and form visible bonds. This created the foundation for atom spawning, movement, bond detection, collision behavior, and basic chemistry visualization.

### Milestone 2 - Complete Periodic Table And Element Inspection

The element system expanded to all 118 elements. Inspection gained shell behavior, electron configuration, valence context, discovery information, descriptions, radioactivity cues, and animated element previews.

### Milestone 3 - Guided Learning Curriculum Reframe

Guided Learning shifted from isolated lesson cards to a structured curriculum framework. The project introduced concept metadata, objectives, recall, common mistakes, summaries, assessments, and spaced repetition.

### Milestone 4 - 3D Molecular Visualization And VSEPR Geometry

The system added 3D molecular rendering and VSEPR geometry analysis. It can represent common geometry families, lone pairs, bond angles, and shape summaries, while remaining transparent about simplified geometry where needed.

### Milestone 5 - Chemistry Lab, PubChem, And AI-Assisted Molecule Interpretation

Chemistry Lab introduced a composition-focused workspace with local molecule analysis, PubChem import, AI notes, inspection, bonding explanation, and deeper interpretation of structures.

### Milestone 6 - The Electron Engine V1

The Electron Engine began the transition from operation-first reaction tools to electron-first mechanism interaction. The v1 foundation includes previews, curved arrows, charge deltas, bond order changes, stability feedback, reaction timeline, undo/redo architecture, and deterministic local reaction primitives.

## Full Roadmap And Expansion Strategy

The expansion strategy is staged. Fundamental electron and bond primitives must be reliable before broad named-reaction coverage is added.

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

A fully fledged rigorous chemistry simulator would extend beyond named reaction coverage. Future research-grade direction could include:

### Isotope And Time Modeling

The isotope/time phase could add:

- All known isotopes.
- Proton/neutron editing.
- Radioisotope creation.
- Half-life simulation.
- Decay products.
- Time slider.
- Time toggle.
- Time multiplier.
- Radioactivity visualization.
- Time-coupled flexible molecular motion.

This must be implemented carefully because isotope identity, nuclear decay, and electron chemistry are related but distinct domains.

### Reaction Coordinate And Energy Modeling

Future reaction visualization could include:

- Energy profiles.
- Transition states.
- Intermediates.
- Reaction coordinate diagrams.
- Relative stability comparison.
- Strain visualization.
- Energy minimization feedback.
- Cause-effect feedback loops after each mechanism step.

These should initially remain qualitative unless validated numerical methods are introduced.

### Validation Datasets

Long-term rigor requires datasets and fixtures:

- Known simple molecule geometries.
- Known formal charge examples.
- Known mechanism steps.
- Curated organic reaction examples.
- PubChem structure comparisons.
- Classroom quiz data.
- Regression fixtures for all supported reaction families.

### Classroom And Lab Modes

The project can support two complementary usage styles:

- Classroom mode for guided learning, teacher-authored lessons, assessments, progress tracking, and mechanism quizzes.
- Lab mode for molecule construction, reaction exploration, mechanism replay, comparison, and report generation.

### AI Tutoring

AI should remain explanatory and advisory:

- Explain why a preview is allowed or blocked.
- Explain selected atoms, bonds, functional groups, and reaction centers.
- Suggest next questions or possible mechanism directions.
- Detect conceptual mistakes in user attempts.
- Generate study prompts from the user's current molecule.

AI should not silently mutate molecule state. Deterministic local rules should remain the chemistry authority.

### Modular Domain Engines

The long-term system can become modular:

- Organic mechanism engine.
- Inorganic/coordination engine.
- Biochemistry engine.
- Electrochemistry engine.
- Materials/polymer engine.
- Quantum visualization engine.
- Education/assessment engine.

Each engine should share a common graph, electron source/target model, validation harness, and explanation interface.

## Testing, Verification, And Known Limitations

### Current Verification Targets

The current verification workflow includes:

- TypeScript static checking.
- Production build.
- Local/static build.
- Unit tests for reactions and electron mechanisms.
- Manual 2D and 3D rendering checks.
- Guided Learning walkthroughs.
- PubChem import checks.
- AI cache checks.
- Chemistry Lab panel synchronization checks.

### Electron Engine Test Direction

The Electron Engine should be tested with:

- Positive reaction fixtures.
- Blocked reaction fixtures.
- Charge and bond-order assertions.
- Stability reason assertions.
- Undo/redo assertions.
- No-mutation preview assertions.
- Curved-arrow payload assertions.
- 2D/3D overlay synchronization checks.

### Known Limitations

The current system has explicit limits:

- It is educational and qualitative.
- It is not quantum-accurate.
- It does not yet implement all named reactions.
- It does not yet predict products universally.
- AI notes may be generic or incomplete and require local chemistry context.
- Some geometry views are simplified.
- PubChem import depends on external data availability.
- Reaction family expansion must be validated gradually.

## Future Research-Grade Direction

To become a rigorous simulator, Atom Bonding Studio should prioritize:

1. A transparent molecule graph with stable atom and bond identities.
2. Exhaustive local rule tests for every supported reaction family.
3. Clear separation between electron mechanism rules, geometry relaxation, and AI explanation.
4. Better hybridization and resonance handling.
5. Better structure normalization and graph comparison.
6. Validated isotope and time models.
7. Explicit uncertainty labels when a chemical model is simplified.
8. Reproducible imports and source labels for external data.
9. Classroom-ready learning analytics and assessments.
10. Mechanism replay and pathway comparison tools.

The most important philosophical constraint is that the simulator should show why chemistry changes, not only that it changes.

## Conclusion

Atom Bonding Studio has grown from an atom bonding playground into a multi-mode chemistry platform with curriculum, periodic data, molecule analysis, PubChem enrichment, AI explanation, 2D/3D visualization, and a developing electron-first reaction engine.

The Electron Engine gives the project its next major technical direction. By treating electrons as the interactive unit of reaction reasoning, the simulator can teach chemistry as a chain of visible consequences: electron movement changes bonds, bonds change charges and geometry, geometry changes polarity and stability, and those changes explain molecular behavior.

The project should continue to scale through staged, testable expansions. The ambition is large, but the path is practical: build reliable primitives, validate them rigorously, expose uncertainty honestly, and let every new feature make chemistry easier to see.
