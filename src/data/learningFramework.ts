import type { ConceptId, ConceptProgress, GuidedLesson, LearningObjective, LessonBridge, QuizQuestion, RecallPrompt } from "../types";

export type ConceptInfo = {
  id: ConceptId;
  title: string;
  definition: string;
  prerequisiteIds?: ConceptId[];
};

export type LessonCurriculum = {
  conceptIds: ConceptId[];
  objectiveIds: string[];
  bridge: LessonBridge;
  recallConceptIds?: ConceptId[];
  stepConceptIds?: ConceptId[][];
};

export type ModuleSummary = {
  title: string;
  overview: string;
  takeaways: string[];
  next: string;
};

type PromptUnlock = {
  lessonId: string;
  stepIndex?: number;
};

export const conceptRegistry: Record<ConceptId, ConceptInfo> = {
  "matter-atoms": {
    id: "matter-atoms",
    title: "Matter is made of atoms",
    definition: "Atoms are the small building blocks that make up elements, molecules, and materials."
  },
  "subatomic-particles": {
    id: "subatomic-particles",
    title: "Subatomic particles",
    definition: "Atoms contain protons and neutrons in the nucleus, with electrons outside the nucleus.",
    prerequisiteIds: ["matter-atoms"]
  },
  "proton-identity": {
    id: "proton-identity",
    title: "Protons identify elements",
    definition: "The number of protons is the atomic number, and it tells you which element the atom is.",
    prerequisiteIds: ["subatomic-particles"]
  },
  "charge-balance": {
    id: "charge-balance",
    title: "Charge balance",
    definition: "Neutral atoms have equal numbers of positive protons and negative electrons.",
    prerequisiteIds: ["subatomic-particles"]
  },
  isotopes: {
    id: "isotopes",
    title: "Isotopes",
    definition: "Isotopes are atoms of the same element with different numbers of neutrons.",
    prerequisiteIds: ["proton-identity"]
  },
  "electron-shells": {
    id: "electron-shells",
    title: "Electron shells",
    definition: "Electrons occupy energy levels called shells, filling lower shells first.",
    prerequisiteIds: ["charge-balance"]
  },
  "valence-electrons": {
    id: "valence-electrons",
    title: "Valence electrons",
    definition: "Valence electrons are the outer-shell electrons that usually control bonding.",
    prerequisiteIds: ["electron-shells"]
  },
  "atomic-models": {
    id: "atomic-models",
    title: "Atomic models",
    definition: "Atomic models are useful simplifications; Bohr shells help counting, while clouds show likely electron regions.",
    prerequisiteIds: ["electron-shells"]
  },
  "periodic-patterns": {
    id: "periodic-patterns",
    title: "Periodic patterns",
    definition: "The periodic table repeats because valence electron patterns repeat.",
    prerequisiteIds: ["valence-electrons"]
  },
  "metals-nonmetals": {
    id: "metals-nonmetals",
    title: "Metals and nonmetals",
    definition: "Metals often lose valence electrons; nonmetals often gain or share them.",
    prerequisiteIds: ["periodic-patterns"]
  },
  "octet-duet": {
    id: "octet-duet",
    title: "Octet and duet",
    definition: "Many atoms become more stable with 8 valence electrons; hydrogen and helium are stable with 2.",
    prerequisiteIds: ["valence-electrons"]
  },
  "lewis-dots": {
    id: "lewis-dots",
    title: "Lewis dots",
    definition: "Lewis dot diagrams show valence electrons as dots around an element symbol.",
    prerequisiteIds: ["valence-electrons"]
  },
  "electron-configuration": {
    id: "electron-configuration",
    title: "Electron configuration",
    definition: "Electron configurations name the shell and subshell locations where electrons are placed.",
    prerequisiteIds: ["electron-shells"]
  },
  "bond-type": {
    id: "bond-type",
    title: "Bond type",
    definition: "Bond type depends on whether electrons are shared, transferred, or mobile across many atoms.",
    prerequisiteIds: ["octet-duet"]
  },
  "covalent-sharing": {
    id: "covalent-sharing",
    title: "Covalent sharing",
    definition: "A covalent bond forms when atoms share one or more pairs of electrons.",
    prerequisiteIds: ["lewis-dots", "octet-duet"]
  },
  "ionic-transfer": {
    id: "ionic-transfer",
    title: "Ionic transfer",
    definition: "Ionic bonding forms when electrons transfer and opposite ions attract.",
    prerequisiteIds: ["charge-balance", "metals-nonmetals"]
  },
  "metallic-bonding": {
    id: "metallic-bonding",
    title: "Metallic bonding",
    definition: "Metal atoms form lattices with mobile valence electrons shared across many atoms.",
    prerequisiteIds: ["metals-nonmetals"]
  },
  electronegativity: {
    id: "electronegativity",
    title: "Electronegativity",
    definition: "Electronegativity measures how strongly an atom pulls shared electrons.",
    prerequisiteIds: ["covalent-sharing"]
  },
  dipoles: {
    id: "dipoles",
    title: "Dipoles",
    definition: "Dipoles form when electron density is uneven, making one side partly negative and the other partly positive.",
    prerequisiteIds: ["electronegativity"]
  },
  "vsepr-regions": {
    id: "vsepr-regions",
    title: "VSEPR regions",
    definition: "VSEPR predicts shape by spacing bonding regions and lone pairs around a central atom.",
    prerequisiteIds: ["covalent-sharing"]
  },
  "lone-pairs": {
    id: "lone-pairs",
    title: "Lone pairs",
    definition: "Lone pairs are valence electron pairs that belong to one atom instead of forming a bond.",
    prerequisiteIds: ["lewis-dots", "vsepr-regions"]
  },
  imfs: {
    id: "imfs",
    title: "Intermolecular forces",
    definition: "Intermolecular forces are attractions between molecules, not the stronger bonds inside molecules.",
    prerequisiteIds: ["dipoles", "lone-pairs"]
  },
  "reaction-energy": {
    id: "reaction-energy",
    title: "Reaction energy",
    definition: "Reactions rearrange atoms by breaking bonds, which takes energy, and forming bonds, which releases energy.",
    prerequisiteIds: ["bond-type"]
  },
  "organic-structure": {
    id: "organic-structure",
    title: "Organic structure",
    definition: "Organic chemistry studies carbon frameworks and the functional groups attached to them.",
    prerequisiteIds: ["covalent-sharing"]
  },
  "real-world-chemistry": {
    id: "real-world-chemistry",
    title: "Chemistry in the world",
    definition: "Molecular structure explains properties such as dissolving, heat absorption, medicines, and materials.",
    prerequisiteIds: ["dipoles", "reaction-energy", "organic-structure"]
  }
};

export const learningObjectives: Record<string, LearningObjective> = {
  "obj-atoms-matter": { id: "obj-atoms-matter", conceptId: "matter-atoms", text: "Describe atoms as the building blocks of matter and molecules." },
  "obj-particles-location": { id: "obj-particles-location", conceptId: "subatomic-particles", text: "Identify protons, neutrons, and electrons by location and charge." },
  "obj-protons-identity": { id: "obj-protons-identity", conceptId: "proton-identity", text: "Use proton count to identify an element and atomic number." },
  "obj-neutral-ion": { id: "obj-neutral-ion", conceptId: "charge-balance", text: "Predict whether an atom is neutral, positive, or negative from protons and electrons." },
  "obj-isotopes": { id: "obj-isotopes", conceptId: "isotopes", text: "Explain isotopes as same-proton, different-neutron atoms." },
  "obj-shell-count": { id: "obj-shell-count", conceptId: "electron-shells", text: "Count shell electrons and recognize inner versus outer shells." },
  "obj-valence": { id: "obj-valence", conceptId: "valence-electrons", text: "Use valence electrons to predict bonding behavior." },
  "obj-models": { id: "obj-models", conceptId: "atomic-models", text: "Compare Bohr shell diagrams with probability cloud models." },
  "obj-periodic": { id: "obj-periodic", conceptId: "periodic-patterns", text: "Connect periodic table groups and periods to valence and shells." },
  "obj-metal-nonmetal": { id: "obj-metal-nonmetal", conceptId: "metals-nonmetals", text: "Explain common metal and nonmetal electron behavior." },
  "obj-octet": { id: "obj-octet", conceptId: "octet-duet", text: "Use octet and duet rules to describe stability." },
  "obj-lewis": { id: "obj-lewis", conceptId: "lewis-dots", text: "Draw or interpret Lewis dots as valence electrons." },
  "obj-config": { id: "obj-config", conceptId: "electron-configuration", text: "Read basic electron configuration notation as shell plus subshell filling." },
  "obj-bond-types": { id: "obj-bond-types", conceptId: "bond-type", text: "Distinguish covalent, ionic, and metallic bonding by electron behavior." },
  "obj-covalent": { id: "obj-covalent", conceptId: "covalent-sharing", text: "Relate single, double, and triple covalent bonds to shared electron pairs." },
  "obj-ionic": { id: "obj-ionic", conceptId: "ionic-transfer", text: "Explain ionic bonding as electron transfer followed by charge attraction." },
  "obj-metallic": { id: "obj-metallic", conceptId: "metallic-bonding", text: "Describe metallic bonding as positive ions with mobile electrons." },
  "obj-en": { id: "obj-en", conceptId: "electronegativity", text: "Use electronegativity difference to reason about bond polarity." },
  "obj-dipoles": { id: "obj-dipoles", conceptId: "dipoles", text: "Predict when bond or molecular dipoles cancel or add." },
  "obj-vsepr": { id: "obj-vsepr", conceptId: "vsepr-regions", text: "Predict simple molecular shapes from electron regions." },
  "obj-lone-pairs": { id: "obj-lone-pairs", conceptId: "lone-pairs", text: "Explain how lone pairs affect shape and bond angle." },
  "obj-imfs": { id: "obj-imfs", conceptId: "imfs", text: "Compare dispersion, dipole-dipole, and hydrogen bonding." },
  "obj-energy": { id: "obj-energy", conceptId: "reaction-energy", text: "Explain why breaking bonds needs energy and forming bonds releases energy." },
  "obj-organic": { id: "obj-organic", conceptId: "organic-structure", text: "Recognize carbon frameworks and functional groups." },
  "obj-real-world": { id: "obj-real-world", conceptId: "real-world-chemistry", text: "Use molecular structure to explain real-world properties." }
};

export const lessonCurriculum: Record<string, LessonCurriculum> = {
  "m01-welcome": entry(["matter-atoms"], ["obj-atoms-matter"], [], "Start by noticing that matter is built from tiny pieces.", "See atoms as building blocks and molecules as connected atoms.", "Atoms are building blocks; molecules are atoms bonded together.", "An atom and a molecule are related, but they are not the same thing."),
  "m01-parts": entry(["subatomic-particles", "charge-balance", "electron-shells", "valence-electrons"], ["obj-particles-location", "obj-neutral-ion", "obj-valence"], ["matter-atoms"], "You have seen atoms. Now zoom inside one atom.", "Name the particles and explain charge balance.", "Protons and neutrons are in the nucleus; electrons are outside.", "Neutrons affect mass, not charge."),
  "m01-isotopes": entry(["proton-identity", "isotopes"], ["obj-protons-identity", "obj-isotopes"], ["subatomic-particles"], "Particles have jobs. Proton count has the naming job.", "Separate element identity from isotope mass.", "Protons define the element; neutrons define the isotope.", "Changing neutrons does not make a new element."),
  "m01-charge": entry(["charge-balance"], ["obj-neutral-ion"], ["proton-identity"], "Element identity is proton count. Charge compares protons and electrons.", "Predict neutral atoms and ions.", "More protons means positive; more electrons means negative.", "Positive ions do not gain protons in ordinary chemistry; they lose electrons."),
  "m01-atomic-number": entry(["proton-identity", "charge-balance", "isotopes"], ["obj-protons-identity", "obj-neutral-ion", "obj-isotopes"], ["subatomic-particles"], "Now connect particles to periodic table numbers.", "Use atomic number and mass number correctly.", "Atomic number is proton count; mass number is protons plus neutrons.", "Atomic mass and atomic number are different ideas."),
  "m01-shells": entry(["electron-shells", "valence-electrons", "electron-configuration"], ["obj-shell-count", "obj-valence", "obj-config"], ["charge-balance"], "Electrons are not all equally important for bonding.", "Find valence electrons from shells.", "The outer shell is the valence shell.", "Do not count all electrons as valence electrons."),
  "m01-models": entry(["atomic-models", "electron-shells"], ["obj-models"], ["electron-shells"], "Shell diagrams are useful, but every model has limits.", "Compare simple shell models with probability clouds.", "Models help answer specific questions.", "A Bohr ring is not a literal racetrack."),
  "m02-groups": entry(["periodic-patterns", "valence-electrons", "electron-shells"], ["obj-periodic", "obj-valence"], ["valence-electrons"], "The periodic table is organized around electron patterns.", "Connect groups to valence electrons and periods to shells.", "Same group usually means similar valence behavior.", "Group number is not always the exact valence count for every element."),
  "m02-metals": entry(["metals-nonmetals", "ionic-transfer", "valence-electrons"], ["obj-metal-nonmetal", "obj-ionic"], ["periodic-patterns"], "Periodic position hints at electron behavior.", "Explain why metals and nonmetals often bond well.", "Metals often lose electrons; nonmetals often gain or share them.", "The metal does not disappear when it loses an electron; it becomes an ion."),
  "m02-trends": entry(["periodic-patterns", "electronegativity"], ["obj-periodic", "obj-en"], ["metals-nonmetals"], "Electron behavior changes in patterns across the table.", "Use trends to compare electron pull.", "Electronegativity generally increases up and to the right.", "Trends are patterns, not perfect rules for every case."),
  "m02-noble": entry(["periodic-patterns", "octet-duet"], ["obj-periodic", "obj-octet"], ["valence-electrons"], "Some atoms are already stable before bonding.", "Explain why noble gases react less often.", "A full valence shell is already stable.", "Stable does not mean impossible to react, just much less likely."),
  "m03-octet": entry(["octet-duet", "valence-electrons"], ["obj-octet", "obj-valence"], ["valence-electrons"], "Valence electrons explain why atoms seek stability.", "Use octet and duet rules to explain bonding goals.", "Many atoms bond to reach a fuller valence shell.", "Atoms do not want anything; this is a stability model."),
  "m03-lewis": entry(["lewis-dots", "valence-electrons", "covalent-sharing"], ["obj-lewis", "obj-covalent"], ["octet-duet"], "Lewis dots are a compact way to track valence electrons.", "Use dots to represent valence electrons and shared pairs.", "Dots show valence electrons only.", "Inner-shell electrons are not drawn in basic Lewis diagrams."),
  "m03-config": entry(["electron-configuration", "electron-shells", "valence-electrons"], ["obj-config", "obj-shell-count"], ["lewis-dots"], "Lewis dots are simple; configurations show more detail.", "Connect configuration notation to shells and valence.", "Configuration names where electrons are placed.", "Filling order and shell grouping are related but not identical."),
  "m03-exceptions": entry(["octet-duet", "lewis-dots", "electron-configuration"], ["obj-octet", "obj-lewis"], ["octet-duet"], "The octet rule is useful, but chemistry has exceptions.", "Recognize common octet exceptions without losing the main rule.", "Hydrogen follows a duet; some atoms have fewer or more than 8.", "Exceptions do not make the octet rule useless."),
  "m04-why-bond": entry(["bond-type", "octet-duet", "valence-electrons"], ["obj-bond-types", "obj-octet"], ["octet-duet"], "Bonding is one way atoms reach more stable electron arrangements.", "Explain bonding as a stability strategy.", "Bonds form when electron arrangements become more stable.", "Atoms do not bond randomly; electron structure matters."),
  "m04-single-bond": entry(["covalent-sharing", "lewis-dots"], ["obj-covalent"], ["lewis-dots"], "Lewis dots help you see shared electron pairs.", "Relate one shared pair to one single bond.", "A single covalent bond is one shared pair.", "One bond line means two shared electrons, not one."),
  "m04-double-bond": entry(["covalent-sharing", "bond-type"], ["obj-covalent"], ["covalent-sharing"], "Some atoms share more than one pair.", "Compare single and double covalent bonds.", "A double bond shares two pairs.", "Double bonds are not two separate molecules touching."),
  "m04-triple-bond": entry(["covalent-sharing", "bond-type"], ["obj-covalent"], ["covalent-sharing"], "Triple bonds extend the same sharing idea.", "Compare bond order with shared electron pairs and strength.", "A triple bond shares three pairs.", "More shared pairs usually means shorter, stronger bonds."),
  "m04-nonpolar-polar": entry(["electronegativity", "dipoles", "covalent-sharing"], ["obj-en", "obj-dipoles"], ["covalent-sharing"], "Covalent sharing can be equal or unequal.", "Identify nonpolar and polar covalent bonds.", "Unequal sharing creates partial charges.", "Polar covalent is not the same as fully ionic."),
  "m04-ionic": entry(["ionic-transfer", "charge-balance", "metals-nonmetals"], ["obj-ionic", "obj-neutral-ion"], ["charge-balance"], "If sharing is very unequal, transfer can happen.", "Explain ionic bonding as electron transfer and attraction.", "Opposite ions attract after electron transfer.", "The electron transfers; protons stay in the nuclei."),
  "m04-metallic": entry(["metallic-bonding", "metals-nonmetals"], ["obj-metallic"], ["metals-nonmetals"], "Metals solve valence stability differently.", "Explain mobile electrons in metal bonding.", "Metal valence electrons can move through a lattice.", "Metallic bonding is not the same as one fixed pair between two atoms."),
  "m04-hbond": entry(["imfs", "dipoles", "lone-pairs"], ["obj-imfs", "obj-dipoles"], ["dipoles"], "Some attractions happen between molecules, not inside one molecule.", "Recognize hydrogen bonding as a strong intermolecular force.", "H bonded to O, N, or F can attract a nearby lone pair.", "Hydrogen bonds are not the same as covalent H-O bonds."),
  "m04-vanderwaals": entry(["imfs", "dipoles"], ["obj-imfs"], ["dipoles"], "Even nonpolar particles can attract weakly.", "Explain temporary dipoles and weak attractions.", "Electron clouds can briefly shift and attract.", "Weak does not mean unimportant when many particles are involved."),
  "m04-bond-summary": entry(["bond-type", "covalent-sharing", "ionic-transfer", "metallic-bonding", "imfs"], ["obj-bond-types"], ["bond-type"], "Now compare the major ways atoms and molecules hold together.", "Sort bonds and attractions by electron behavior.", "Electron behavior is the best clue to bond type.", "Do not rank every bond only by one number; context matters."),
  "m05-en-intro": entry(["electronegativity", "covalent-sharing"], ["obj-en"], ["covalent-sharing"], "Polar bonding begins with electron pull.", "Define electronegativity as electron-pulling strength.", "Higher electronegativity means stronger pull on shared electrons.", "Electronegativity is not the same as charge."),
  "m05-bond-class": entry(["electronegativity", "bond-type", "ionic-transfer"], ["obj-en", "obj-bond-types"], ["electronegativity"], "Electronegativity difference helps classify bonds.", "Use EN difference to compare nonpolar, polar, and ionic bonds.", "Bigger EN difference means more ionic character.", "Cutoffs are guides, not magic walls."),
  "m05-dipole": entry(["dipoles", "electronegativity", "vsepr-regions"], ["obj-dipoles"], ["electronegativity"], "A polar bond creates a direction of electron pull.", "Explain bond and molecular dipoles.", "Molecular dipole depends on both polar bonds and shape.", "A molecule with polar bonds can still be nonpolar overall."),
  "m05-cancel": entry(["dipoles", "vsepr-regions"], ["obj-dipoles"], ["dipoles"], "Shape decides whether pulls cancel.", "Explain dipole cancellation in symmetric molecules.", "Equal opposite dipoles cancel.", "Canceling dipoles does not mean the bonds are nonpolar."),
  "m06-vsepr": entry(["vsepr-regions", "lone-pairs", "covalent-sharing"], ["obj-vsepr", "obj-lone-pairs"], ["covalent-sharing"], "Bonding creates electron regions around atoms.", "Use electron-region repulsion to predict shape.", "Electron regions spread out to reduce repulsion.", "VSEPR counts regions, not individual electrons."),
  "m06-linear": entry(["vsepr-regions", "dipoles"], ["obj-vsepr"], ["vsepr-regions"], "Start VSEPR with the simplest case.", "Recognize two regions as linear.", "Two regions spread 180 degrees apart.", "A double bond counts as one region in VSEPR."),
  "m06-trigonal": entry(["vsepr-regions"], ["obj-vsepr"], ["vsepr-regions"], "Add one more region and the shape changes.", "Recognize three regions as trigonal planar.", "Three regions spread into a flat triangle.", "Trigonal planar is not pyramidal."),
  "m06-tetrahedral": entry(["vsepr-regions"], ["obj-vsepr"], ["vsepr-regions"], "Four regions need 3D spacing.", "Recognize tetrahedral geometry.", "Four bonding regions form a tetrahedral arrangement.", "A tetrahedron is not a flat square."),
  "m06-bent": entry(["lone-pairs", "vsepr-regions", "dipoles"], ["obj-lone-pairs", "obj-vsepr"], ["vsepr-regions"], "Lone pairs count as regions too.", "Explain why water is bent.", "Lone pairs repel and push bonds closer together.", "Water is not linear because oxygen has lone pairs."),
  "m06-ammonia": entry(["lone-pairs", "vsepr-regions"], ["obj-lone-pairs", "obj-vsepr"], ["lone-pairs"], "One lone pair gives a different 3D shape.", "Explain trigonal pyramidal geometry.", "NH3 has three bonds and one lone pair.", "Pyramidal and trigonal planar are different shapes."),
  "m07-imf-intro": entry(["imfs", "dipoles", "covalent-sharing"], ["obj-imfs"], ["bond-type"], "Bonds hold atoms within a molecule; IMFs attract separate molecules.", "Distinguish intramolecular bonds from intermolecular forces.", "IMFs are between molecules.", "Do not confuse hydrogen bonds with H-O covalent bonds."),
  "m07-london": entry(["imfs", "dipoles"], ["obj-imfs"], ["imfs"], "The weakest IMF still happens everywhere.", "Explain dispersion as temporary electron-cloud shifts.", "All atoms and molecules have dispersion forces.", "Nonpolar does not mean no attraction at all."),
  "m07-dipole-dipole": entry(["imfs", "dipoles"], ["obj-imfs", "obj-dipoles"], ["dipoles"], "Permanent dipoles make stronger attractions than fleeting ones.", "Recognize dipole-dipole attraction.", "Positive ends attract negative ends.", "Dipole-dipole requires polar molecules."),
  "m07-hbond-deep": entry(["imfs", "lone-pairs", "dipoles"], ["obj-imfs", "obj-lone-pairs"], ["lone-pairs"], "Hydrogen bonding combines polarity and lone pairs.", "Explain the O/N/F requirement for hydrogen bonding.", "A very polar H can attract a nearby lone pair.", "Not every molecule with H can hydrogen-bond strongly."),
  "m07-imf-effects": entry(["imfs", "real-world-chemistry"], ["obj-imfs", "obj-real-world"], ["imfs"], "Small attractions add up to visible properties.", "Connect IMF strength to boiling point.", "Stronger IMFs make molecules harder to separate.", "Boiling point is about separating molecules, not breaking covalent bonds."),
  "m08-reaction": entry(["reaction-energy", "bond-type"], ["obj-energy"], ["bond-type"], "Reactions change which atoms are bonded to which.", "Describe reactions as atom rearrangements.", "Atoms are conserved; bonds rearrange.", "Ordinary reactions do not turn one element into another."),
  "m08-bond-energy": entry(["reaction-energy", "covalent-sharing"], ["obj-energy"], ["covalent-sharing"], "Bond rearrangement has an energy cost.", "Explain energy input and release in bond changes.", "Breaking bonds takes energy; forming bonds releases energy.", "Breaking bonds alone does not release energy."),
  "m08-exo-endo": entry(["reaction-energy"], ["obj-energy"], ["reaction-energy"], "Net energy depends on the whole reaction.", "Compare exothermic and endothermic reactions.", "Exothermic releases energy overall; endothermic absorbs energy overall.", "A reaction can require a start even if it releases energy later."),
  "m08-activation": entry(["reaction-energy"], ["obj-energy"], ["reaction-energy"], "Reactants need enough energy to start changing bonds.", "Define activation energy.", "Activation energy is the starting energy barrier.", "A catalyst lowers the barrier; it does not change the atoms."),
  "m08-rates": entry(["reaction-energy"], ["obj-energy"], ["reaction-energy"], "Collision chances affect reaction speed.", "Explain factors that change reaction rate.", "More effective collisions usually mean faster reactions.", "Rate is not the same thing as total energy released."),
  "m09-carbon": entry(["organic-structure", "covalent-sharing", "valence-electrons"], ["obj-organic", "obj-covalent"], ["covalent-sharing"], "Carbon's valence makes it a framework builder.", "Explain why carbon forms chains and rings.", "Carbon commonly forms four covalent bonds.", "Organic does not mean safe or natural; it means carbon chemistry."),
  "m09-hydrocarbons": entry(["organic-structure", "bond-type"], ["obj-organic"], ["organic-structure"], "Carbon frameworks can use different bond orders.", "Compare alkanes, alkenes, alkynes, and aromatics.", "Hydrocarbons contain carbon and hydrogen.", "A double bond changes both shape and reactivity."),
  "m09-functional": entry(["organic-structure", "dipoles"], ["obj-organic"], ["dipoles"], "Adding atoms besides C and H changes behavior.", "Recognize functional groups as property-changing groups.", "Functional groups create predictable behavior.", "The carbon skeleton and the functional group both matter."),
  "m09-isomers": entry(["organic-structure"], ["obj-organic"], ["organic-structure"], "Same formula can still mean different structure.", "Explain isomers as different arrangements.", "Structure controls properties.", "Same formula does not guarantee same molecule."),
  "m09-biomolecules": entry(["organic-structure", "real-world-chemistry"], ["obj-organic", "obj-real-world"], ["organic-structure"], "Large biological molecules use the same bonding ideas.", "Connect carbon chemistry to life molecules.", "Big molecules still follow valence, shape, and polarity rules.", "Large does not mean chemically unrelated to small molecules."),
  "m10-water": entry(["real-world-chemistry", "dipoles", "imfs"], ["obj-real-world", "obj-dipoles"], ["dipoles"], "Water's familiar behavior comes from molecular polarity.", "Explain dissolving using polarity and ion attraction.", "Polar water stabilizes ions and polar molecules.", "Dissolving salt is not the same as melting salt."),
  "m10-climate": entry(["real-world-chemistry", "reaction-energy", "dipoles"], ["obj-real-world"], ["dipoles"], "Bonds can interact with light energy.", "Connect CO2 bond vibrations to heat absorption.", "Molecular vibrations can absorb infrared energy.", "CO2 matters because of how its bonds interact with IR, not because it is hot."),
  "m10-pharma": entry(["real-world-chemistry", "organic-structure", "imfs"], ["obj-real-world", "obj-organic"], ["organic-structure"], "Molecular shape and functional groups affect interactions.", "Explain drug fit using shape and attractions.", "A medicine works by matching molecular features to a target.", "Molecules do not work only because of formula; 3D arrangement matters."),
  "m10-materials": entry(["real-world-chemistry", "metallic-bonding", "organic-structure"], ["obj-real-world"], ["metallic-bonding"], "Materials are designed by controlling bonding and structure.", "Connect bonding type to material properties.", "Different bonding networks create different properties.", "A material's behavior is not just the element list; arrangement matters.")
};

export const moduleSummaries: Record<string, ModuleSummary> = {
  m01: { title: "Module 1 review: atoms", overview: "You learned the parts of atoms, how charge works, and why outer electrons matter.", takeaways: ["Protons identify the element.", "Electrons control charge and bonding.", "Valence electrons are the outer-shell electrons.", "Models are tools, not perfect pictures."], next: "Next, the periodic table organizes those electron patterns." },
  m02: { title: "Module 2 review: periodic patterns", overview: "You used shells and valence electrons to read the periodic table.", takeaways: ["Groups repeat valence patterns.", "Periods add shells.", "Metals and nonmetals behave differently.", "Noble gases are stable because their valence shells are full."], next: "Next, stability becomes the reason atoms form bonds." },
  m03: { title: "Module 3 review: stability and notation", overview: "You connected valence electrons to octets, Lewis dots, and electron configurations.", takeaways: ["Lewis dots show valence electrons.", "Many atoms stabilize near an octet.", "Hydrogen follows a duet.", "Configurations give a more detailed electron map."], next: "Next, those stability patterns become chemical bonds." },
  m04: { title: "Module 4 review: bond types", overview: "You compared sharing, transfer, metallic electron movement, and weaker attractions.", takeaways: ["Covalent bonds share pairs.", "Ionic bonds form through transfer and attraction.", "Metals use mobile electrons.", "Hydrogen bonds and van der Waals forces act between particles."], next: "Next, electronegativity explains unequal sharing." },
  m05: { title: "Module 5 review: electron pull", overview: "You learned how electronegativity creates polar bonds and molecular dipoles.", takeaways: ["Higher EN pulls shared electrons harder.", "EN difference helps classify bonds.", "Molecule shape decides whether dipoles cancel."], next: "Next, VSEPR predicts the shapes that control many dipoles." },
  m06: { title: "Module 6 review: molecular shape", overview: "You used electron-region repulsion to predict common shapes.", takeaways: ["VSEPR counts regions around a central atom.", "Double bonds count as one region.", "Lone pairs affect bond angles and shapes.", "Shape affects molecular polarity."], next: "Next, shape and polarity explain attractions between molecules." },
  m07: { title: "Module 7 review: intermolecular forces", overview: "You compared attractions between molecules and connected them to properties.", takeaways: ["Dispersion exists for all particles.", "Dipole-dipole forces need polar molecules.", "Hydrogen bonding needs H with O, N, or F.", "Stronger IMFs raise boiling points."], next: "Next, reactions rearrange bonds and exchange energy." },
  m08: { title: "Module 8 review: reactions and energy", overview: "You described reactions as bond rearrangements with energy changes.", takeaways: ["Atoms are conserved in ordinary reactions.", "Breaking bonds takes energy.", "Making bonds releases energy.", "Activation energy starts the reaction."], next: "Next, carbon chemistry uses the same bonding rules in larger structures." },
  m09: { title: "Module 9 review: organic structure", overview: "You saw how carbon frameworks and functional groups create many molecules.", takeaways: ["Carbon commonly forms four bonds.", "Bond order changes structure and behavior.", "Functional groups shape properties.", "Isomers prove arrangement matters."], next: "Next, these ideas explain real-world chemistry." },
  m10: { title: "Module 10 review: real-world chemistry", overview: "You connected bonding, shape, polarity, and energy to materials, climate, water, and medicines.", takeaways: ["Water dissolves through polarity.", "CO2 absorbs infrared through bond vibrations.", "Medicines depend on shape and functional groups.", "Materials depend on bonding and structure."], next: "You now have a connected foundation for exploring molecules in the simulator." }
};

const inlineStepConcepts: Record<string, ConceptId[][]> = {
  "m01-welcome": [
    ["matter-atoms"],
    ["matter-atoms"],
    ["matter-atoms"],
    ["matter-atoms"]
  ],
  "m01-parts": [
    ["subatomic-particles"],
    ["subatomic-particles", "charge-balance"],
    ["electron-shells"],
    ["valence-electrons"],
    ["proton-identity", "isotopes"]
  ],
  "m01-isotopes": [
    ["proton-identity"],
    ["isotopes"],
    ["isotopes", "proton-identity"]
  ],
  "m01-charge": [
    ["charge-balance"],
    ["charge-balance"],
    ["charge-balance"]
  ],
  "m01-atomic-number": [
    ["proton-identity"],
    ["proton-identity"],
    ["isotopes"]
  ],
  "m01-shells": [
    ["electron-shells"],
    ["valence-electrons"],
    ["electron-shells"],
    ["electron-shells", "atomic-models"]
  ],
  "m01-models": [
    ["atomic-models"],
    ["atomic-models"],
    ["atomic-models", "electron-shells"]
  ],
  "m02-groups": [
    ["periodic-patterns", "valence-electrons"],
    ["periodic-patterns", "electron-shells"]
  ],
  "m02-metals": [
    ["metals-nonmetals", "valence-electrons"],
    ["ionic-transfer", "metals-nonmetals", "charge-balance"]
  ],
  "m02-trends": [
    ["periodic-patterns", "electronegativity"]
  ],
  "m02-noble": [
    ["periodic-patterns", "octet-duet", "valence-electrons"],
    ["octet-duet", "periodic-patterns"]
  ],
  "m03-octet": [
    ["octet-duet", "valence-electrons"],
    ["octet-duet", "covalent-sharing"]
  ],
  "m03-lewis": [
    ["lewis-dots", "valence-electrons"],
    ["lewis-dots", "covalent-sharing"]
  ],
  "m03-config": [
    ["electron-configuration", "electron-shells"],
    ["electron-configuration", "valence-electrons"]
  ],
  "m03-exceptions": [
    ["octet-duet", "lewis-dots", "electron-configuration"]
  ],
  "m04-why-bond": [
    ["bond-type", "octet-duet", "valence-electrons"],
    ["bond-type", "covalent-sharing", "octet-duet"]
  ],
  "m04-single-bond": [
    ["covalent-sharing", "lewis-dots"]
  ],
  "m04-double-bond": [
    ["covalent-sharing", "bond-type"]
  ],
  "m04-triple-bond": [
    ["covalent-sharing", "bond-type"],
    ["covalent-sharing", "bond-type"]
  ],
  "m04-nonpolar-polar": [
    ["electronegativity", "dipoles", "covalent-sharing"]
  ],
  "m04-ionic": [
    ["ionic-transfer", "charge-balance", "metals-nonmetals"]
  ],
  "m04-metallic": [
    ["metallic-bonding", "metals-nonmetals"],
    ["metallic-bonding"]
  ],
  "m04-hbond": [
    ["imfs", "dipoles", "lone-pairs"],
    ["imfs"]
  ],
  "m04-vanderwaals": [
    ["imfs", "dipoles"]
  ],
  "m04-bond-summary": [
    ["bond-type", "covalent-sharing", "ionic-transfer", "metallic-bonding", "imfs"]
  ],
  "m05-en-intro": [
    ["electronegativity", "covalent-sharing"]
  ],
  "m05-bond-class": [
    ["electronegativity", "bond-type", "ionic-transfer"]
  ],
  "m05-dipole": [
    ["dipoles", "electronegativity"]
  ],
  "m05-cancel": [
    ["dipoles", "vsepr-regions"]
  ],
  "m06-vsepr": [
    ["vsepr-regions"],
    ["vsepr-regions"]
  ],
  "m06-linear": [
    ["vsepr-regions", "dipoles"]
  ],
  "m06-trigonal": [
    ["vsepr-regions"]
  ],
  "m06-tetrahedral": [
    ["vsepr-regions"]
  ],
  "m06-bent": [
    ["lone-pairs", "vsepr-regions", "dipoles"]
  ],
  "m06-ammonia": [
    ["lone-pairs", "vsepr-regions"]
  ],
  "m07-imf-intro": [
    ["imfs", "bond-type"]
  ],
  "m07-london": [
    ["imfs", "dipoles"]
  ],
  "m07-dipole-dipole": [
    ["imfs", "dipoles"]
  ],
  "m07-hbond-deep": [
    ["imfs", "lone-pairs", "dipoles"]
  ],
  "m07-imf-effects": [
    ["imfs", "real-world-chemistry"]
  ],
  "m08-reaction": [
    ["reaction-energy", "bond-type"]
  ],
  "m08-bond-energy": [
    ["reaction-energy", "covalent-sharing"]
  ],
  "m08-exo-endo": [
    ["reaction-energy"]
  ],
  "m08-activation": [
    ["reaction-energy"]
  ],
  "m08-rates": [
    ["reaction-energy"]
  ],
  "m09-carbon": [
    ["organic-structure", "covalent-sharing", "valence-electrons"]
  ],
  "m09-hydrocarbons": [
    ["organic-structure", "bond-type"]
  ],
  "m09-functional": [
    ["organic-structure", "dipoles"]
  ],
  "m09-isomers": [
    ["organic-structure"]
  ],
  "m09-biomolecules": [
    ["organic-structure", "real-world-chemistry"]
  ],
  "m10-water": [
    ["real-world-chemistry", "dipoles", "imfs"]
  ],
  "m10-climate": [
    ["real-world-chemistry", "reaction-energy"]
  ],
  "m10-pharma": [
    ["real-world-chemistry", "organic-structure", "imfs"]
  ],
  "m10-materials": [
    ["real-world-chemistry", "metallic-bonding", "organic-structure"]
  ]
};

const conceptUnlocks: Record<ConceptId, PromptUnlock> = {
  "matter-atoms": { lessonId: "m01-welcome", stepIndex: 0 },
  "subatomic-particles": { lessonId: "m01-parts", stepIndex: 0 },
  "proton-identity": { lessonId: "m01-parts", stepIndex: 4 },
  "charge-balance": { lessonId: "m01-charge", stepIndex: 0 },
  "isotopes": { lessonId: "m01-isotopes", stepIndex: 1 },
  "electron-shells": { lessonId: "m01-parts", stepIndex: 2 },
  "valence-electrons": { lessonId: "m01-parts", stepIndex: 3 },
  "atomic-models": { lessonId: "m01-models", stepIndex: 0 },
  "periodic-patterns": { lessonId: "m02-groups", stepIndex: 0 },
  "metals-nonmetals": { lessonId: "m02-metals", stepIndex: 0 },
  "octet-duet": { lessonId: "m03-octet", stepIndex: 0 },
  "lewis-dots": { lessonId: "m03-lewis", stepIndex: 0 },
  "electron-configuration": { lessonId: "m03-config", stepIndex: 0 },
  "bond-type": { lessonId: "m04-why-bond", stepIndex: 0 },
  "covalent-sharing": { lessonId: "m04-single-bond", stepIndex: 0 },
  "ionic-transfer": { lessonId: "m04-ionic", stepIndex: 0 },
  "metallic-bonding": { lessonId: "m04-metallic", stepIndex: 0 },
  "electronegativity": { lessonId: "m05-en-intro", stepIndex: 0 },
  "dipoles": { lessonId: "m05-dipole", stepIndex: 0 },
  "vsepr-regions": { lessonId: "m06-vsepr", stepIndex: 0 },
  "lone-pairs": { lessonId: "m06-bent", stepIndex: 0 },
  "imfs": { lessonId: "m07-imf-intro", stepIndex: 0 },
  "reaction-energy": { lessonId: "m08-reaction", stepIndex: 0 },
  "organic-structure": { lessonId: "m09-carbon", stepIndex: 0 },
  "real-world-chemistry": { lessonId: "m10-water", stepIndex: 0 }
};

const promptUnlocks: Record<string, PromptUnlock> = {
  "matter-1": { lessonId: "m01-welcome", stepIndex: 2 },
  "matter-2": { lessonId: "m01-welcome", stepIndex: 2 },
  "matter-3": { lessonId: "m01-welcome", stepIndex: 0 },
  "matter-4": { lessonId: "m01-welcome", stepIndex: 2 },
  "matter-5": { lessonId: "m01-welcome", stepIndex: 1 },
  "matter-6": { lessonId: "m01-welcome", stepIndex: 2 },
  "matter-7": { lessonId: "m01-welcome", stepIndex: 3 },
  "matter-8": { lessonId: "m01-welcome", stepIndex: 2 },
  "particles-3": { lessonId: "m01-parts", stepIndex: 1 },
  "charge-1": { lessonId: "m01-parts", stepIndex: 1 },
  "isotope-4": { lessonId: "m01-atomic-number", stepIndex: 2 },
  "shells-1": { lessonId: "m01-parts", stepIndex: 2 },
  "shells-4": { lessonId: "m01-shells", stepIndex: 1 },
  "valence-1": { lessonId: "m01-parts", stepIndex: 3 },
  "valence-2": { lessonId: "m01-parts", stepIndex: 3 },
  "valence-3": { lessonId: "m01-parts", stepIndex: 3 },
  "valence-4": { lessonId: "m02-groups", stepIndex: 0 },
  "periodic-2": { lessonId: "m02-groups", stepIndex: 1 },
  "periodic-3": { lessonId: "m02-noble", stepIndex: 0 },
  "periodic-4": { lessonId: "m02-trends", stepIndex: 0 },
  "metal-2": { lessonId: "m02-metals", stepIndex: 0 },
  "metal-3": { lessonId: "m02-metals", stepIndex: 1 },
  "metal-4": { lessonId: "m02-metals", stepIndex: 0 },
  "octet-2": { lessonId: "m03-octet", stepIndex: 0 },
  "octet-3": { lessonId: "m03-octet", stepIndex: 1 },
  "octet-4": { lessonId: "m03-exceptions", stepIndex: 0 },
  "bond-2": { lessonId: "m04-why-bond", stepIndex: 1 },
  "bond-3": { lessonId: "m04-ionic", stepIndex: 0 },
  "bond-4": { lessonId: "m04-metallic", stepIndex: 0 },
  "covalent-1": { lessonId: "m04-single-bond", stepIndex: 0 },
  "covalent-2": { lessonId: "m04-double-bond", stepIndex: 0 },
  "covalent-3": { lessonId: "m04-triple-bond", stepIndex: 0 },
  "covalent-4": { lessonId: "m04-nonpolar-polar", stepIndex: 0 },
  "en-2": { lessonId: "m05-bond-class", stepIndex: 0 },
  "en-3": { lessonId: "m05-dipole", stepIndex: 0 },
  "en-4": { lessonId: "m04-nonpolar-polar", stepIndex: 0 },
  "dipole-2": { lessonId: "m05-cancel", stepIndex: 0 },
  "dipole-3": { lessonId: "m06-bent", stepIndex: 0 },
  "dipole-4": { lessonId: "m05-cancel", stepIndex: 0 },
  "vsepr-2": { lessonId: "m06-linear", stepIndex: 0 },
  "vsepr-3": { lessonId: "m06-tetrahedral", stepIndex: 0 },
  "vsepr-4": { lessonId: "m06-vsepr", stepIndex: 0 },
  "lone-2": { lessonId: "m06-bent", stepIndex: 0 },
  "lone-3": { lessonId: "m06-bent", stepIndex: 0 },
  "lone-4": { lessonId: "m06-ammonia", stepIndex: 0 },
  "imf-2": { lessonId: "m07-london", stepIndex: 0 },
  "imf-3": { lessonId: "m07-hbond-deep", stepIndex: 0 },
  "imf-4": { lessonId: "m07-imf-effects", stepIndex: 0 },
  "energy-2": { lessonId: "m08-bond-energy", stepIndex: 0 },
  "energy-3": { lessonId: "m08-bond-energy", stepIndex: 0 },
  "energy-4": { lessonId: "m08-activation", stepIndex: 0 },
  "organic-2": { lessonId: "m09-functional", stepIndex: 0 },
  "organic-3": { lessonId: "m09-isomers", stepIndex: 0 },
  "organic-4": { lessonId: "m09-hydrocarbons", stepIndex: 0 },
  "real-2": { lessonId: "m10-climate", stepIndex: 0 },
  "real-3": { lessonId: "m10-pharma", stepIndex: 0 },
  "real-4": { lessonId: "m10-materials", stepIndex: 0 }
};

export const recallPrompts: RecallPrompt[] = [
  q("matter-1", "matter-atoms", "What is a molecule made from?", ["Atoms", "Only neutrons", "Only light", "Heat"], 0, "Molecules are groups of atoms bonded together.", "matter-basic"),
  q("matter-2", "matter-atoms", "Which statement best connects atoms and molecules?", ["Molecules are bonded atoms", "Atoms are always larger", "Molecules have no electrons", "Atoms only exist in metals"], 0, "A molecule forms when atoms are bonded in a specific arrangement.", "matter-basic"),
  q("matter-3", "matter-atoms", "What is the best first idea for chemistry?", ["Matter is made from atoms", "All atoms are identical", "Atoms have no parts", "Only gases have atoms"], 0, "Chemistry starts by explaining matter through atoms.", "matter-basic"),
  q("matter-4", "matter-atoms", "If two hydrogen atoms bond, they form...", ["H2", "He", "NaCl", "O3"], 0, "H2 is a molecule made from two bonded hydrogen atoms.", "matter-h2"),
  q("matter-5", "matter-atoms", "A single hydrogen atom is an...", ["Atom", "Molecule", "Table salt crystal", "Energy level"], 0, "One hydrogen particle by itself is an atom.", "atom-vs-molecule"),
  q("matter-6", "matter-atoms", "Two bonded hydrogen atoms are a...", ["Molecule", "Single atom", "Neutron", "Periodic table"], 0, "Bonded atoms form a molecule.", "atom-vs-molecule"),
  q("matter-7", "matter-atoms", "In H2, the 2 tells you there are two...", ["Hydrogen atoms", "Neutrons", "Charges", "Shells"], 0, "The subscript 2 means two hydrogen atoms are in the molecule.", "formula-h2"),
  q("matter-8", "matter-atoms", "The simulator starts chemistry by showing atoms that can...", ["Connect into molecules", "Turn into light", "Lose their names", "Become only heat"], 0, "The first idea is that atoms can connect into molecules.", "matter-basic"),

  q("particles-1", "subatomic-particles", "Where are protons found?", ["In the nucleus", "In outer shells", "Between molecules", "Only in bonds"], 0, "Protons are in the nucleus.", "particles-location"),
  q("particles-2", "subatomic-particles", "Which particle has no charge?", ["Neutron", "Proton", "Electron", "Ion"], 0, "Neutrons are neutral.", "particles-charge"),
  q("particles-3", "subatomic-particles", "Which particle is negative?", ["Electron", "Proton", "Neutron", "Nucleus"], 0, "Electrons carry negative charge.", "particles-charge"),
  q("particles-4", "subatomic-particles", "Which two particles are in the nucleus?", ["Protons and neutrons", "Electrons and protons", "Electrons and shells", "Ions and bonds"], 0, "The nucleus contains protons and neutrons.", "particles-location"),

  q("proton-1", "proton-identity", "What determines an element's identity?", ["Number of protons", "Number of neutrons", "Temperature", "Bond length"], 0, "The proton count is the atomic number and identifies the element.", "proton-identity"),
  q("proton-2", "proton-identity", "Oxygen has atomic number 8. What does that mean?", ["It has 8 protons", "It has 8 neutrons only", "It has 8 shells", "It has charge +8 always"], 0, "Atomic number equals proton count.", "proton-identity"),
  q("proton-3", "proton-identity", "If an atom's proton count changes, what changes?", ["The element", "Only isotope", "Only state of matter", "Only temperature"], 0, "Changing protons changes the element.", "proton-identity"),
  q("proton-4", "proton-identity", "Hydrogen has one proton. Helium has...", ["Two protons", "One proton", "No protons", "Eight protons"], 0, "Helium is defined by two protons.", "proton-identity"),

  q("charge-1", "charge-balance", "A neutral atom has equal numbers of...", ["Protons and electrons", "Protons and neutrons", "Electrons and shells", "Bonds and neutrons"], 0, "Positive protons and negative electrons cancel when counts match.", "charge-neutral"),
  q("charge-2", "charge-balance", "An atom with more electrons than protons is...", ["Negative", "Positive", "Neutral", "A new element"], 0, "Extra electrons give a negative charge.", "charge-ion"),
  q("charge-3", "charge-balance", "An atom with 11 protons and 10 electrons has charge...", ["+1", "-1", "0", "+10"], 0, "One extra proton compared with electrons gives +1.", "charge-count"),
  q("charge-4", "charge-balance", "Positive ions usually form when atoms...", ["Lose electrons", "Gain protons", "Lose neutrons", "Gain neutrons"], 0, "Ordinary ions form by electron changes, not proton changes.", "charge-ion"),

  q("isotope-1", "isotopes", "Isotopes have the same number of protons but different numbers of...", ["Neutrons", "Elements", "Electrons always", "Bonds"], 0, "Isotopes differ by neutron count.", "isotope-definition"),
  q("isotope-2", "isotopes", "Hydrogen-1 and hydrogen-2 are both hydrogen because both have...", ["1 proton", "1 neutron", "2 electrons", "No nucleus"], 0, "Same proton count means same element.", "isotope-definition"),
  q("isotope-3", "isotopes", "Changing neutron count changes the...", ["Isotope", "Element identity", "Atomic number", "Proton charge"], 0, "Different neutron count creates a different isotope.", "isotope-effect"),
  q("isotope-4", "isotopes", "Mass number equals...", ["Protons plus neutrons", "Protons plus electrons", "Electrons only", "Bonds plus shells"], 0, "Mass number counts protons and neutrons.", "mass-number"),

  q("shells-1", "electron-shells", "Electrons occupy energy levels called...", ["Shells", "Neutrons", "Nuclei", "Ions"], 0, "Shells are simplified electron energy levels.", "shell-definition"),
  q("shells-2", "electron-shells", "The first shell can hold up to...", ["2 electrons", "8 electrons", "10 electrons", "18 electrons"], 0, "The first shell holds up to 2 electrons.", "shell-capacity"),
  q("shells-3", "electron-shells", "Electrons generally fill shells from...", ["Inside outward", "Outside inward", "Random only", "The heaviest shell first"], 0, "Lower inner shells fill before outer shells in the simplified model.", "shell-filling"),
  q("shells-4", "electron-shells", "For oxygen written as 2,6, the valence shell has...", ["6 electrons", "2 electrons", "8 electrons", "16 electrons"], 0, "The outer shell is the second shell with 6 electrons.", "shell-count"),

  q("valence-1", "valence-electrons", "Valence electrons are found in the...", ["Outermost shell", "Nucleus", "Neutrons", "Mass number"], 0, "Valence electrons are outer-shell electrons.", "valence-location"),
  q("valence-2", "valence-electrons", "Which electrons are most involved in bonding?", ["Valence electrons", "Inner-shell electrons", "Neutrons", "Protons"], 0, "Valence electrons control most bonding behavior.", "valence-role"),
  q("valence-3", "valence-electrons", "Carbon has electron shells 2,4. How many valence electrons?", ["4", "2", "6", "8"], 0, "The outer shell has 4 electrons.", "valence-count"),
  q("valence-4", "valence-electrons", "Why do atoms in the same group often behave similarly?", ["Similar valence electrons", "Same mass", "Same neutron count", "Same color"], 0, "Group patterns repeat valence electron counts.", "valence-periodic"),

  q("models-1", "atomic-models", "The Bohr model is useful for showing...", ["Electron shells", "Exact electron paths", "Neutron color", "Bond strength only"], 0, "Bohr diagrams simplify electrons into shell rings.", "model-bohr"),
  q("models-2", "atomic-models", "A probability cloud shows where electrons are...", ["Likely to be found", "Definitely fixed", "Only in the nucleus", "Changed into protons"], 0, "Clouds show likely electron regions.", "model-cloud"),
  q("models-3", "atomic-models", "Which model is simpler for counting valence electrons?", ["Bohr model", "Probability cloud", "Reaction energy graph", "Metal lattice only"], 0, "Bohr shells are useful for counting shells and valence electrons.", "model-use"),
  q("models-4", "atomic-models", "A scientific model should be treated as...", ["A useful tool", "A perfect copy of reality", "A guess with no value", "Only a drawing"], 0, "Models simplify reality to help answer questions.", "model-purpose"),

  q("periodic-1", "periodic-patterns", "Elements in the same group usually have similar...", ["Valence electron counts", "Atomic masses only", "Neutron counts", "Melting points always"], 0, "Groups repeat valence patterns.", "periodic-group"),
  q("periodic-2", "periodic-patterns", "Periods on the table are connected to...", ["Electron shells", "Lewis dots only", "Neutron charge", "Bond order"], 0, "Moving to a new period adds an electron shell.", "periodic-period"),
  q("periodic-3", "periodic-patterns", "Noble gases are stable mainly because they have...", ["Full valence shells", "No electrons", "Only neutrons", "Metallic bonds"], 0, "A full outer shell is already stable.", "periodic-noble"),
  q("periodic-4", "periodic-patterns", "Periodic trends are best described as...", ["Useful patterns", "Random facts", "Perfect laws with no exceptions", "Only molecule shapes"], 0, "Trends are helpful patterns with exceptions.", "periodic-trends"),

  q("metal-1", "metals-nonmetals", "Metals often form positive ions because they...", ["Lose electrons", "Gain protons", "Lose protons", "Gain neutrons"], 0, "Metals commonly lose valence electrons.", "metal-behavior"),
  q("metal-2", "metals-nonmetals", "Nonmetals often become stable by...", ["Gaining or sharing electrons", "Losing protons", "Becoming metals", "Removing the nucleus"], 0, "Nonmetals often gain or share electrons.", "nonmetal-behavior"),
  q("metal-3", "metals-nonmetals", "Na is a metal and Cl is a nonmetal. Their bonding often involves...", ["Electron transfer", "No electron movement", "Nuclear fusion", "Only dispersion"], 0, "Metal plus nonmetal often forms ionic bonding.", "metal-nonmetal-bond"),
  q("metal-4", "metals-nonmetals", "Metals are generally found on which side of the periodic table?", ["Left and center", "Far right only", "Top row only", "Nowhere"], 0, "Most metals are on the left and center.", "metal-location"),

  q("octet-1", "octet-duet", "The octet rule says many atoms are stable with...", ["8 valence electrons", "8 protons", "8 neutrons", "8 bonds always"], 0, "Octet means 8 valence electrons.", "octet-rule"),
  q("octet-2", "octet-duet", "Hydrogen is stable with 2 electrons because it follows the...", ["Duet rule", "Octet rule", "Metal rule", "VSEPR rule"], 0, "Hydrogen's first shell fills at 2 electrons.", "duet-rule"),
  q("octet-3", "octet-duet", "Oxygen has 6 valence electrons, so it often needs...", ["2 more", "6 more", "8 more", "0 more always"], 0, "6 plus 2 reaches an octet.", "octet-count"),
  q("octet-4", "octet-duet", "The octet rule is best understood as...", ["A stability model", "A rule about protons", "Always exact for every atom", "Only about metals"], 0, "It is a useful model with exceptions.", "octet-model"),

  q("lewis-1", "lewis-dots", "Lewis dot diagrams show...", ["Valence electrons", "All protons", "Neutrons", "Only atomic mass"], 0, "Lewis dots show valence electrons.", "lewis-purpose"),
  q("lewis-2", "lewis-dots", "Carbon usually has how many Lewis dots?", ["4", "2", "6", "8"], 0, "Carbon has 4 valence electrons.", "lewis-carbon"),
  q("lewis-3", "lewis-dots", "A shared pair in a Lewis diagram represents...", ["A covalent bond", "A neutron pair", "A metal ion", "Atomic mass"], 0, "A covalent bond is a shared electron pair.", "lewis-shared"),
  q("lewis-4", "lewis-dots", "Which electrons are usually omitted from simple Lewis dots?", ["Inner-shell electrons", "Valence electrons", "Bonding electrons", "Outer electrons"], 0, "Lewis diagrams usually omit inner-shell electrons.", "lewis-omit"),

  q("config-1", "electron-configuration", "In 2p6, the 2 means...", ["Shell number", "Six protons", "Two neutrons", "Bond order"], 0, "The leading number is the principal shell.", "config-labels"),
  q("config-2", "electron-configuration", "In 2p6, the p means...", ["Subshell", "Proton", "Polarity", "Period only"], 0, "Letters such as s and p are subshell names.", "config-labels"),
  q("config-3", "electron-configuration", "In 2p6, the 6 means...", ["Number of electrons in that subshell", "Atomic number", "Number of bonds", "Charge"], 0, "The superscript count is the electron count.", "config-labels"),
  q("config-4", "electron-configuration", "Electron configuration is a more detailed way to describe...", ["Where electrons are placed", "Only where protons are", "Molecule color", "Boiling point"], 0, "Configurations describe electron placement by shells and subshells.", "config-purpose"),

  q("bond-1", "bond-type", "Bond type mainly depends on how electrons are...", ["Shared, transferred, or mobile", "Destroyed", "Turned into protons", "Heated only"], 0, "Electron behavior is the clue to bond type.", "bond-type"),
  q("bond-2", "bond-type", "A covalent bond involves electron...", ["Sharing", "Transfer only", "A metal sea only", "No movement"], 0, "Covalent bonds share electron pairs.", "bond-covalent"),
  q("bond-3", "bond-type", "An ionic bond involves electron transfer and then...", ["Opposite-charge attraction", "No attraction", "Only shape change", "Neutron transfer"], 0, "Opposite ions attract after transfer.", "bond-ionic"),
  q("bond-4", "bond-type", "Metallic bonding involves valence electrons that are...", ["Mobile across many atoms", "Locked between two atoms only", "Inside neutrons", "Gone"], 0, "Metallic electrons can move through the lattice.", "bond-metallic"),

  q("covalent-1", "covalent-sharing", "A single covalent bond has how many shared pairs?", ["1", "2", "3", "4"], 0, "A single bond is one shared pair.", "single-pair"),
  q("covalent-2", "covalent-sharing", "A double bond shares how many electrons?", ["4", "2", "6", "8"], 0, "A double bond has two shared pairs, or 4 electrons.", "double-electrons"),
  q("covalent-3", "covalent-sharing", "A triple bond has...", ["3 shared pairs", "1 shared pair", "No shared electrons", "Only ions"], 0, "A triple bond is three shared pairs.", "triple-pair"),
  q("covalent-4", "covalent-sharing", "Covalent sharing usually happens between...", ["Nonmetals", "Only metals", "Only noble gases", "Only ions"], 0, "Nonmetals often share electrons with other nonmetals.", "covalent-nonmetals"),

  q("ionic-1", "ionic-transfer", "When sodium becomes Na+, it has...", ["Lost one electron", "Gained one proton", "Gained one electron", "Lost one proton"], 0, "Na+ forms when sodium loses an electron.", "ionic-sodium"),
  q("ionic-2", "ionic-transfer", "Chlorine becomes Cl- when it...", ["Gains one electron", "Loses one proton", "Gains one proton", "Loses all electrons"], 0, "Extra electron gives chlorine a negative charge.", "ionic-chlorine"),
  q("ionic-3", "ionic-transfer", "Why do Na+ and Cl- attract?", ["Opposite charges", "Same charges", "Both are neutral", "Both are gases"], 0, "Opposite electric charges attract.", "ionic-attraction"),
  q("ionic-4", "ionic-transfer", "In ionic bonding, the transferred particle is usually an...", ["Electron", "Proton", "Neutron", "Whole nucleus"], 0, "Chemical ion formation involves electron transfer.", "ionic-particle"),

  q("metallic-1", "metallic-bonding", "Metallic bonding is often described as positive ions in a sea of...", ["Mobile electrons", "Neutrons", "Protons", "Water"], 0, "Mobile valence electrons move through the metal lattice.", "metallic-sea"),
  q("metallic-2", "metallic-bonding", "Metals conduct electricity well because electrons can...", ["Move", "Disappear", "Become neutrons", "Stop all motion"], 0, "Mobile electrons carry charge.", "metallic-conduct"),
  q("metallic-3", "metallic-bonding", "Metal atoms in a lattice are held together by...", ["Shared mobile electrons", "Only hydrogen bonds", "Only lone pairs", "No forces"], 0, "Metallic bonding uses a delocalized electron sea.", "metallic-lattice"),
  q("metallic-4", "metallic-bonding", "Metallic bonding differs from covalent bonding because electrons are...", ["Shared across many atoms", "Always transferred to chlorine", "Only in one fixed pair", "Only in the nucleus"], 0, "Metallic electrons are delocalized.", "metallic-delocalized"),

  q("en-1", "electronegativity", "Electronegativity measures how strongly an atom pulls...", ["Shared electrons", "Neutrons", "Heat", "The whole molecule only"], 0, "EN is attraction for bonding electrons.", "en-definition"),
  q("en-2", "electronegativity", "A larger EN difference usually means a bond is more...", ["Polar or ionic", "Metallic only", "Nonpolar", "Radioactive"], 0, "Bigger differences make electron sharing more uneven.", "en-difference"),
  q("en-3", "electronegativity", "In H-Cl, chlorine is partially negative because it...", ["Pulls electrons harder", "Has fewer protons", "Loses electrons", "Has no electrons"], 0, "Cl is more electronegative than H.", "en-hcl"),
  q("en-4", "electronegativity", "Equal electron sharing is called...", ["Nonpolar covalent", "Ionic", "Metallic", "Hydrogen bonding"], 0, "Equal sharing produces a nonpolar covalent bond.", "en-nonpolar"),

  q("dipole-1", "dipoles", "A dipole has...", ["Partial positive and partial negative ends", "No charge pattern", "Only neutrons", "Only full ions"], 0, "Uneven electron density creates partial charges.", "dipole-definition"),
  q("dipole-2", "dipoles", "A molecule with polar bonds can be nonpolar if dipoles...", ["Cancel", "Double automatically", "Turn into protons", "Become neutrons"], 0, "Symmetric dipoles can cancel.", "dipole-cancel"),
  q("dipole-3", "dipoles", "Water has a net dipole mainly because it is...", ["Bent", "Linear", "A noble gas", "Metallic"], 0, "Water's bent shape prevents cancellation.", "dipole-water"),
  q("dipole-4", "dipoles", "CO2 is nonpolar overall because it is...", ["Linear and symmetric", "Bent", "Ionic", "Made of metals"], 0, "The two C=O dipoles cancel in linear CO2.", "dipole-co2"),

  q("vsepr-1", "vsepr-regions", "VSEPR predicts shape by counting electron regions around the...", ["Central atom", "Farthest atom", "Lightest atom", "Nucleus only"], 0, "VSEPR focuses on regions around a central atom.", "vsepr-central"),
  q("vsepr-2", "vsepr-regions", "Two electron regions usually form a...", ["Linear shape", "Bent shape", "Pyramid", "Tetrahedron"], 0, "Two regions spread 180 degrees apart.", "vsepr-linear"),
  q("vsepr-3", "vsepr-regions", "Four bonding regions around carbon in CH4 form a...", ["Tetrahedral shape", "Linear shape", "Bent shape", "Flat line"], 0, "Four regions spread in 3D as a tetrahedron.", "vsepr-tetra"),
  q("vsepr-4", "vsepr-regions", "In VSEPR, a double bond counts as...", ["One electron region", "Two separate regions", "No region", "Four lone pairs"], 0, "Multiple bonds count as one region for shape.", "vsepr-region-count"),

  q("lone-1", "lone-pairs", "A lone pair is a pair of valence electrons that...", ["Does not form a bond", "Has no charge", "Is in the nucleus", "Belongs to two atoms equally"], 0, "Lone pairs are nonbonding valence pairs.", "lone-definition"),
  q("lone-2", "lone-pairs", "Water's oxygen has how many lone pairs?", ["2", "0", "1", "4"], 0, "Oxygen in water has two lone pairs.", "lone-water"),
  q("lone-3", "lone-pairs", "Lone pairs affect molecular shape because they...", ["Repel bonding pairs", "Become protons", "Remove shells", "Have no effect"], 0, "Lone pairs repel and alter bond angles.", "lone-repel"),
  q("lone-4", "lone-pairs", "NH3 is trigonal pyramidal because nitrogen has...", ["3 bonds and 1 lone pair", "4 bonds and no lone pairs", "2 bonds and 2 lone pairs", "No valence electrons"], 0, "Three bonds plus one lone pair gives a pyramidal shape.", "lone-nh3"),

  q("imf-1", "imfs", "Intermolecular forces act...", ["Between molecules", "Inside the nucleus", "Only inside one covalent bond", "Only between protons"], 0, "IMFs are attractions between separate molecules or particles.", "imf-definition"),
  q("imf-2", "imfs", "London dispersion comes from...", ["Temporary dipoles", "Permanent ions only", "Nuclear decay", "Mass number"], 0, "Electron clouds fluctuate to create temporary dipoles.", "imf-london"),
  q("imf-3", "imfs", "Hydrogen bonding requires H bonded to...", ["O, N, or F", "Any carbon", "Any metal", "Any noble gas"], 0, "Strong hydrogen bonding requires H attached to O, N, or F.", "imf-hbond"),
  q("imf-4", "imfs", "Stronger IMFs usually mean a substance has a higher...", ["Boiling point", "Atomic number", "Proton charge", "Electron mass"], 0, "Stronger attractions make molecules harder to separate.", "imf-property"),

  q("energy-1", "reaction-energy", "In ordinary chemical reactions, atoms are...", ["Rearranged", "Destroyed", "Changed into new elements", "Always lost"], 0, "Chemical reactions rearrange atoms.", "reaction-atoms"),
  q("energy-2", "reaction-energy", "Breaking bonds requires...", ["Energy input", "Energy release only", "No energy", "Neutron transfer"], 0, "Energy is required to break bonds.", "reaction-breaking"),
  q("energy-3", "reaction-energy", "Forming bonds usually...", ["Releases energy", "Requires protons", "Destroys atoms", "Stops reactions"], 0, "Bond formation releases energy.", "reaction-forming"),
  q("energy-4", "reaction-energy", "Activation energy is the energy needed to...", ["Start a reaction", "Name an element", "Make an isotope", "Fill a shell only"], 0, "Activation energy is the starting barrier.", "reaction-activation"),

  q("organic-1", "organic-structure", "Carbon commonly forms how many bonds?", ["4", "1", "2", "8"], 0, "Carbon commonly forms four covalent bonds.", "organic-carbon"),
  q("organic-2", "organic-structure", "A functional group is important because it affects...", ["Chemical behavior", "Proton identity", "Neutron charge", "Atomic number"], 0, "Functional groups strongly shape molecule properties.", "organic-functional"),
  q("organic-3", "organic-structure", "Isomers have the same formula but different...", ["Arrangements", "Elements", "Atomic numbers", "Charges always"], 0, "Isomers differ in structure.", "organic-isomers"),
  q("organic-4", "organic-structure", "A hydrocarbon contains mainly...", ["Carbon and hydrogen", "Sodium and chlorine", "Only oxygen", "Only metals"], 0, "Hydrocarbons are made of carbon and hydrogen.", "organic-hydrocarbon"),

  q("real-1", "real-world-chemistry", "Water dissolves many ionic compounds because water is...", ["Polar", "Nonpolar", "Metallic", "A noble gas"], 0, "Water's polarity helps stabilize ions.", "real-water"),
  q("real-2", "real-world-chemistry", "CO2 absorbs infrared energy through...", ["Bond vibrations", "Neutron transfer", "Metallic bonding", "Proton loss"], 0, "C=O bond vibrations interact with infrared radiation.", "real-co2"),
  q("real-3", "real-world-chemistry", "Drug-target fit depends strongly on molecular...", ["Shape and functional groups", "Color only", "Atomic number only", "Mass number only"], 0, "Shape and groups control molecular interactions.", "real-pharma"),
  q("real-4", "real-world-chemistry", "A material's properties depend on bonding and...", ["Structure", "Name length", "Screen color", "Randomness only"], 0, "Arrangement and bonding determine material behavior.", "real-materials")
];

export function curriculumForLesson(lesson: GuidedLesson) {
  return lessonCurriculum[lesson.id] ?? fallbackCurriculum(lesson);
}

export function conceptsForLesson(lesson: GuidedLesson): ConceptId[] {
  return curriculumForLesson(lesson).conceptIds;
}

export function objectivesForLesson(lesson: GuidedLesson) {
  return curriculumForLesson(lesson).objectiveIds.map((id) => learningObjectives[id]).filter(Boolean);
}

export function objectivesForStep(lesson: GuidedLesson, stepIndex: number) {
  const concepts = new Set(conceptsForStep(lesson, stepIndex));
  return objectivesForLesson(lesson).filter((objective) => concepts.has(objective.conceptId));
}

export function conceptsForStep(lesson: GuidedLesson, stepIndex: number): ConceptId[] {
  const curriculum = curriculumForLesson(lesson);
  return inlineStepConcepts[lesson.id]?.[stepIndex] ?? curriculum.stepConceptIds?.[stepIndex] ?? curriculum.conceptIds;
}

export function recallCandidatesForLesson(lesson: GuidedLesson, stepIndex: number, completedLessons: string[], progress: Record<string, ConceptProgress>) {
  const introduced = introducedConceptsFor(lesson, stepIndex, completedLessons);
  const currentStep = conceptsForStep(lesson, stepIndex).filter((concept) => introduced.has(concept));
  const review = (curriculumForLesson(lesson).recallConceptIds ?? []).filter((concept) => introduced.has(concept));
  const gate = { lesson, stepIndex, completedLessons };
  const currentPrompt = selectPrompts(currentStep, progress, 1, 1, "inline", new Set<string>(), gate);
  if (currentPrompt.length) return currentPrompt;
  return selectPrompts(review, progress, completedLessons.length > 2 ? 1 : 0, 1, "inline", new Set<string>(), gate);
}

export function buildLessonQuizQuestions(lesson: GuidedLesson, completedLessons: string[], progress: Record<string, ConceptProgress>) {
  const currentConcepts = conceptsIntroducedByLesson(lesson);
  const prerequisiteConcepts = prerequisiteConceptsFor(currentConcepts);
  const gate = { lesson, stepIndex: Math.max(0, lesson.steps.length - 1), completedLessons };
  const current = selectPrompts(currentConcepts, progress, 3, 4, "lesson", new Set<string>(), gate);
  const review = selectPrompts(prerequisiteConcepts, progress, completedLessons.length > 2 ? 1 : 0, 1, "lesson", new Set(current.map((item) => item.variantOf ?? item.id)), gate);
  const base = [...current, ...review];
  const fallback = lesson.quizzes ?? [];
  return shuffleQuestions(base.length ? base : fallback).slice(0, Math.max(2, Math.min(5, base.length || fallback.length)));
}

export function buildModuleAssessmentQuestions(moduleId: string, moduleLessons: GuidedLesson[], completedLessons: string[], progress: Record<string, ConceptProgress>) {
  const moduleConcepts = [...new Set(moduleLessons.flatMap(conceptsForLesson))];
  const prerequisiteConcepts = prerequisiteConceptsFor(moduleConcepts);
  const weakConcepts = weakestConcepts(progress, moduleConcepts);
  const selected: RecallPrompt[] = [];
  const usedVariants = new Set<string>();
  const gate = { completedLessons };
  addSelected(selected, usedVariants, selectPrompts(moduleConcepts, progress, 5, 6, "module", usedVariants, gate));
  addSelected(selected, usedVariants, selectPrompts(prerequisiteConcepts, progress, completedLessons.length > 4 ? 2 : 1, 2, "module", usedVariants, gate));
  addSelected(selected, usedVariants, selectPrompts(weakConcepts, progress, 1, 1, "module", usedVariants, gate));
  return shuffleQuestions(selected).slice(0, Math.min(8, Math.max(4, selected.length)));
}

export function buildCumulativeReviewQuestions(currentLesson: GuidedLesson, completedLessons: string[], progress: Record<string, ConceptProgress>) {
  if (completedLessons.length < 2 || completedLessons.length % 3 !== 0) return [];
  const current = new Set(conceptsForLesson(currentLesson));
  const priorConcepts = [...new Set(completedLessons.flatMap((id) => {
    const lesson = lessonCurriculum[id];
    return lesson?.conceptIds ?? [];
  }).filter((concept) => !current.has(concept)))];
  return shuffleQuestions(selectPrompts(priorConcepts, progress, 2, 2, "cumulative", new Set<string>(), { completedLessons })).slice(0, 2);
}

export function updateConceptProgress(progress: Record<string, ConceptProgress>, questions: QuizQuestion[], answers: Record<number, number>) {
  const now = Date.now();
  const next = { ...progress };
  questions.forEach((question, index) => {
    if (!question.conceptId) return;
    const current = next[question.conceptId] ?? { conceptId: question.conceptId, seen: 0, correct: 0, lastSeenAt: 0 };
    const wasCorrect = answers[index] === question.correctIndex;
    next[question.conceptId] = {
      ...current,
      seen: current.seen + 1,
      correct: current.correct + (wasCorrect ? 1 : 0),
      lastSeenAt: now
    };
  });
  return next;
}

function entry(conceptIds: ConceptId[], objectiveIds: string[], recallConceptIds: ConceptId[], before: string, today: string, keyIdea: string, commonMistake?: string): LessonCurriculum {
  return {
    conceptIds,
    objectiveIds,
    recallConceptIds,
    bridge: {
      before: [before],
      today,
      keyIdea,
      commonMistake
    }
  };
}

function q(id: string, conceptId: ConceptId, question: string, options: string[], correctIndex: number, explanation: string, variantOf: string): RecallPrompt {
  return {
    id,
    conceptId,
    question,
    options,
    correctIndex,
    explanation,
    variantOf,
    difficulty: "foundation",
    reviewKind: "inline",
    promptKind: "quiz"
  };
}

function fallbackCurriculum(lesson: GuidedLesson): LessonCurriculum {
  const conceptIds = moduleFallbackConcepts[lesson.moduleId] ?? ["matter-atoms"];
  return {
    conceptIds,
    objectiveIds: [],
    bridge: {
      before: ["Use what you have already learned to connect this example to the larger chemistry pattern."],
      today: lesson.focus,
      keyIdea: conceptRegistry[conceptIds[0]].definition
    }
  };
}

const moduleFallbackConcepts: Record<string, ConceptId[]> = {
  m01: ["subatomic-particles"],
  m02: ["periodic-patterns"],
  m03: ["octet-duet"],
  m04: ["bond-type"],
  m05: ["electronegativity"],
  m06: ["vsepr-regions"],
  m07: ["imfs"],
  m08: ["reaction-energy"],
  m09: ["organic-structure"],
  m10: ["real-world-chemistry"]
};

function prerequisiteConceptsFor(concepts: ConceptId[]) {
  const result = new Set<ConceptId>();
  const visit = (conceptId: ConceptId) => {
    for (const pre of conceptRegistry[conceptId]?.prerequisiteIds ?? []) {
      if (result.has(pre)) continue;
      result.add(pre);
      visit(pre);
    }
  };
  concepts.forEach(visit);
  return [...result];
}

function introducedConceptsFor(lesson: GuidedLesson, stepIndex: number, completedLessons: string[]) {
  const introduced = new Set<ConceptId>();
  for (const lessonId of completedLessons) {
    const curriculum = lessonCurriculum[lessonId];
    if (!curriculum) continue;
    for (const concept of curriculum.conceptIds) introduced.add(concept);
  }
  for (let index = 0; index <= stepIndex; index += 1) {
    for (const concept of conceptsForStep(lesson, index)) introduced.add(concept);
  }
  return introduced;
}

function conceptsIntroducedByLesson(lesson: GuidedLesson) {
  return [...new Set(lesson.steps.flatMap((_, index) => conceptsForStep(lesson, index)))];
}

function selectPrompts(
  concepts: ConceptId[],
  progress: Record<string, ConceptProgress>,
  min: number,
  max: number,
  reviewKind: QuizQuestion["reviewKind"],
  usedVariants = new Set<string>(),
  gate?: { lesson?: GuidedLesson; stepIndex?: number; completedLessons: string[] }
) {
  if (!concepts.length || max <= 0) return [];
  const conceptSet = new Set(concepts);
  const candidates = recallPrompts
    .filter((prompt) => conceptSet.has(prompt.conceptId))
    .filter((prompt) => promptIsUnlocked(prompt, gate))
    .map((prompt) => ({
      ...prompt,
      reviewKind,
      score: promptScore(prompt, progress)
        + (promptMatchesCurrentLesson(prompt, gate) ? 60 : 0)
        + (promptMatchesCurrentStep(prompt, gate) ? 120 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const selected: RecallPrompt[] = [];
  const localVariants = new Set(usedVariants);
  for (const candidate of candidates) {
    const variant = candidate.variantOf ?? candidate.id;
    if (localVariants.has(variant)) continue;
    selected.push(candidate);
    localVariants.add(variant);
    if (selected.length >= max) break;
  }
  if (selected.length < min) {
    for (const candidate of shuffle(candidates)) {
      if (selected.some((item) => item.id === candidate.id)) continue;
      selected.push(candidate);
      if (selected.length >= min) break;
    }
  }
  return selected;
}

function promptIsUnlocked(prompt: RecallPrompt, gate?: { lesson?: GuidedLesson; stepIndex?: number; completedLessons: string[] }) {
  if (!gate) return true;
  const unlock = promptUnlockFor(prompt);
  if (!unlock) return true;
  if (gate.completedLessons.includes(unlock.lessonId)) return true;
  if (gate.lesson?.id !== unlock.lessonId) return false;
  return (gate.stepIndex ?? Number.POSITIVE_INFINITY) >= (unlock.stepIndex ?? 0);
}

function promptMatchesCurrentLesson(prompt: RecallPrompt, gate?: { lesson?: GuidedLesson; stepIndex?: number; completedLessons: string[] }) {
  if (!gate?.lesson) return false;
  const unlock = promptUnlockFor(prompt);
  return unlock?.lessonId === gate.lesson.id && (gate.stepIndex ?? Number.POSITIVE_INFINITY) >= (unlock.stepIndex ?? 0);
}

function promptMatchesCurrentStep(prompt: RecallPrompt, gate?: { lesson?: GuidedLesson; stepIndex?: number; completedLessons: string[] }) {
  if (!gate?.lesson || gate.stepIndex === undefined) return false;
  const unlock = promptUnlockFor(prompt);
  return unlock?.lessonId === gate.lesson.id && (unlock.stepIndex ?? 0) === gate.stepIndex;
}

function promptUnlockFor(prompt: RecallPrompt) {
  return promptUnlocks[prompt.id] ?? conceptUnlocks[prompt.conceptId];
}

function promptScore(prompt: RecallPrompt, progress: Record<string, ConceptProgress>) {
  const concept = progress[prompt.conceptId];
  if (!concept) return 100;
  const accuracy = concept.seen ? concept.correct / concept.seen : 0;
  const age = Math.min(40, (Date.now() - concept.lastSeenAt) / 1000 / 60);
  return (1 - accuracy) * 80 + age + Math.max(0, 6 - concept.seen) * 4;
}

function weakestConcepts(progress: Record<string, ConceptProgress>, exclude: ConceptId[]) {
  const excluded = new Set(exclude);
  return Object.values(progress)
    .filter((item) => !excluded.has(item.conceptId) && item.seen > 0)
    .sort((a, b) => (a.correct / Math.max(1, a.seen)) - (b.correct / Math.max(1, b.seen)))
    .slice(0, 3)
    .map((item) => item.conceptId);
}

function addSelected(selected: RecallPrompt[], usedVariants: Set<string>, prompts: RecallPrompt[]) {
  for (const prompt of prompts) {
    const variant = prompt.variantOf ?? prompt.id;
    if (usedVariants.has(variant)) continue;
    selected.push(prompt);
    usedVariants.add(variant);
  }
}

function shuffleQuestions<T extends QuizQuestion>(questions: T[]): QuizQuestion[] {
  return shuffle(questions).map(shuffleQuestionOptions);
}

function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  const options = question.options.map((option, index) => ({ option, index }));
  const shuffled = shuffle(options);
  return {
    ...question,
    options: shuffled.map((item) => item.option),
    correctIndex: shuffled.findIndex((item) => item.index === question.correctIndex)
  };
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
